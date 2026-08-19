"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { generateTempPassword } from "@/lib/utils";
import { UserRole, StudentStatus, RoomStatus } from "@prisma/client";
import {
  bulkCreateStudents,
  sendStudentCredentials,
  loginUrl as portalSignInUrl,
  type BulkStudentRow,
} from "@/services/students";
import { sendTemplatedEmail } from "@/services/email";
import { sendStatusSMS, smsProviderStatus } from "@/services/sms";
import { EMAIL_SUBJECTS } from "@/constants/messages";
import { MUFUDZI_INTAKE } from "@/data/mufudzi-intake";
import { audit } from "@/services/audit";
import type { ActionResult } from "@/types";

/** Typed exactly to confirm the destructive tenant-data reset. */
const RESET_PHRASE = "RESET";

function loginUrl(): string {
  const base = process.env.APP_URL || process.env.NEXTAUTH_URL || "";
  return `${base.replace(/\/$/, "")}/auth/login`;
}

/**
 * Create (or reset the password of) an owner/admin account and send it login
 * credentials. The account is forced to change its password on first sign-in.
 */
export async function createAdminAccount(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("OWNER");
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const name = String(formData.get("name") || "").trim() || "Administrator";
  const phone = String(formData.get("phone") || "").trim() || null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { success: false, error: "Enter a valid admin email." };
  }

  try {
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const existing = await prisma.user.findUnique({ where: { email } });
    await (existing
      ? prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            phone: phone ?? undefined,
            role: UserRole.OWNER,
            isActive: true,
            passwordHash,
            mustChangePassword: true,
          },
        })
      : prisma.user.create({
          data: {
            email,
            name,
            phone,
            role: UserRole.OWNER,
            passwordHash,
            mustChangePassword: true,
          },
        }));

    const data = { studentName: name, email, password: tempPassword, loginUrl: loginUrl() };
    const emailRes = await sendTemplatedEmail(
      email,
      EMAIL_SUBJECTS.credentialsIssued,
      "credentialsIssued",
      data,
    ).catch(() => ({ ok: false }) as { ok: boolean });
    let smsOk = false;
    if (phone) {
      const r = await sendStatusSMS(phone, "credentialsIssued", data).catch(
        () => ({ ok: false }) as { ok: boolean },
      );
      smsOk = Boolean(r.ok);
    }

    await audit({
      action: "admin.account_provisioned",
      entityType: "User",
      metadata: { email, emailSent: Boolean(emailRes.ok), smsSent: smsOk },
    });

    revalidatePath("/owner/intake");
    return {
      success: true,
      message: `Admin ${email} ready. Credentials ${emailRes.ok ? "emailed" : "NOT emailed"}${phone ? (smsOk ? " + texted" : " (SMS failed)") : " (no phone → email only)"}.`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * DESTRUCTIVE: delete all tenant / transactional data (students + their user
 * logins, applications, invoices, payments, receipts, statements, service
 * requests, and student notifications/messages) and reset room occupancy.
 * Houses, rooms, owner/caretaker accounts and settings are preserved. Requires
 * the caller to type the exact confirmation phrase.
 */
export async function resetTenantData(formData: FormData): Promise<ActionResult> {
  await requireRole("OWNER");
  if (String(formData.get("confirm") || "").trim() !== RESET_PHRASE) {
    return { success: false, error: `Type ${RESET_PHRASE} to confirm the reset.` };
  }
  try {
    const studentUserIds = (
      await prisma.user.findMany({
        where: { role: UserRole.STUDENT },
        select: { id: true },
      })
    ).map((u) => u.id);

    await prisma.$transaction([
      prisma.receipt.deleteMany(),
      prisma.paymentTransaction.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.invoice.deleteMany(),
      prisma.statement.deleteMany(),
      prisma.serviceRequest.deleteMany(),
      prisma.application.deleteMany(),
      prisma.notification.deleteMany({ where: { userId: { in: studentUserIds } } }),
      prisma.messageLog.deleteMany({ where: { senderId: { in: studentUserIds } } }),
      prisma.studentProfile.deleteMany(),
      prisma.user.deleteMany({ where: { role: UserRole.STUDENT } }),
      prisma.room.updateMany({
        data: { occupied: 0, status: RoomStatus.AVAILABLE },
      }),
    ]);

    await audit({
      action: "owner.tenant_data_reset",
      metadata: { removedStudents: studentUserIds.length },
    });

    revalidatePath("/owner");
    revalidatePath("/owner/students");
    return {
      success: true,
      message: `Tenant data cleared (${studentUserIds.length} student logins removed). Houses & rooms preserved.`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Import the Mufudzi House intake roster (the cleaned 54 students). Optionally
 * resets tenant data first when the confirmation phrase is supplied. Creates
 * accounts + records deposits, but does NOT send credentials (do that as a
 * separate, deliberate step so you can verify first).
 */
export async function importMufudziIntake(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("OWNER");
  const doReset = String(formData.get("confirm") || "").trim() === RESET_PHRASE;

  try {
    if (doReset) {
      const reset = await resetTenantData(formData);
      if (!reset.success) return reset;
    }

    const house = await prisma.house.findUnique({ where: { slug: "mufudzi" } });
    if (!house) {
      return {
        success: false,
        error: "Mufudzi house not found — seed the houses first.",
      };
    }

    const rows: BulkStudentRow[] = MUFUDZI_INTAKE.map((s) => ({
      fullName: s.fullName,
      email: s.email,
      phone: s.phone,
      deposit: s.deposit,
    }));

    const sendNow = String(formData.get("sendNow") || "") === "on";
    const result = await bulkCreateStudents(rows, {
      houseId: house.id,
      status: StudentStatus.ACTIVE,
      sendCredentials: sendNow,
    });

    revalidatePath("/owner/students");
    revalidatePath("/owner");
    revalidatePath("/owner/intake");
    return {
      success: true,
      message: `Imported ${result.created.length} students into Mufudzi House${result.skipped.length ? `, skipped ${result.skipped.length}` : ""}. ${sendNow ? "Credentials sent." : "Credentials NOT sent yet — use step 3."}`,
      data: { created: result.created.length, skipped: result.skipped },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Send login credentials (email + SMS) to students. Scope:
 *  - "unsent": only students who've never been sent credentials (default)
 *  - "all": every student (rotates each password)
 * Each send rotates to a fresh temporary password so what's delivered works.
 */
export async function sendCredentialsBatch(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("OWNER");
  const scope = String(formData.get("scope") || "unsent");
  try {
    const students = await prisma.studentProfile.findMany({
      where: scope === "all" ? {} : { credentialsSentAt: null },
      select: { id: true, phone: true },
      orderBy: { createdAt: "asc" },
    });

    let emailOk = 0;
    let smsOk = 0;
    let failed = 0;
    for (const s of students) {
      const r = await sendStudentCredentials(s.id);
      if (r.email) emailOk++;
      if (r.sms) smsOk++;
      if (!r.ok) failed++;
    }

    await audit({
      action: "owner.credentials_batch_sent",
      metadata: { scope, total: students.length, emailOk, smsOk, failed },
    });

    revalidatePath("/owner/intake");
    revalidatePath("/owner/students");
    return {
      success: true,
      message: `Sent to ${students.length} students — ${emailOk} emailed, ${smsOk} texted${failed ? `, ${failed} with no channel delivered` : ""}.`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Import the August book: rooms 1–40 (two sharing, $120), every student on
 * the sheet placed and ACTIVE, and each ledger rebuilt so the dashboards
 * read paid-in-full / paid-for-the-month / not-paid directly. Resumable —
 * a timed-out run continues from where it stopped on the next click.
 */
export async function importMufudziAugust(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("OWNER");
  if (String(formData.get("confirm") || "").trim().toUpperCase() !== "IMPORT") {
    return { success: false, error: "Type IMPORT to confirm." };
  }
  try {
    const { runMufudziAugustImport } = await import("@/services/students/august-import");
    const s = await runMufudziAugustImport();

    await audit({
      action: "owner.august_roster_imported",
      metadata: { ...s },
    });

    revalidatePath("/owner");
    revalidatePath("/owner/students");
    revalidatePath("/owner/rooms");
    revalidatePath("/owner/payments");
    revalidatePath("/owner/intake");
    revalidatePath("/houses");

    return {
      success: true,
      message: s.done
        ? `August roster imported: ${s.rooms} rooms, ${s.processed} students ` +
          `(${s.created} new, ${s.updated} updated), ${s.receipts} receipts. ` +
          `Paid in full: ${s.paidInFull} · paid first month: ${s.paidOneMonth} · ` +
          `partly paid: ${s.partiallyPaid} · not paid: ${s.notPaid}.`
        : `Import ran out of time after ${s.processed} students — click again to continue (already-done students are skipped).`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Tell every student with a real address that their records were updated —
 * and remind the ones still owing to pay. Placeholder (@unknown.invalid)
 * addresses are skipped rather than bounced.
 */
export async function sendAugustNotices(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("OWNER");
  const viaEmail = String(formData.get("viaEmail") || "") === "on";
  const viaSms = String(formData.get("viaSms") || "") === "on";
  if (!viaEmail && !viaSms) {
    return { success: false, error: "Pick at least one channel." };
  }
  try {
    const { NotificationChannel } = await import("@prisma/client");
    const { sendMessage } = await import("@/services/messaging");
    const base = (process.env.APP_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");

    const students = await prisma.studentProfile.findMany({
      where: { status: "ACTIVE", house: { slug: "mufudzi" } },
      include: {
        charges: {
          where: { status: "OUTSTANDING" },
          select: { amount: true, allocations: { select: { amount: true } } },
        },
      },
    });

    const channels = [
      ...(viaEmail ? [NotificationChannel.EMAIL] : []),
      ...(viaSms ? [NotificationChannel.SMS] : []),
    ];

    let emailSent = 0, smsSent = 0, failed = 0, skippedNoContact = 0;
    for (const s of students) {
      const deliverableEmail = !s.email.endsWith("@unknown.invalid");
      if (!deliverableEmail && !s.phone) { skippedNoContact++; continue; }

      const owing = s.charges.reduce((sum, c) => {
        const alloc = c.allocations.reduce((a, x) => a + Number(x.amount), 0);
        return sum + Math.max(0, Number(c.amount) - alloc);
      }, 0);

      const lines = [
        `Hi ${s.fullName.split(" ")[0]}, your Mufudzi House records (room, payments, balance) have been updated.`,
        `Log in at ${base}/auth/login to check they're correct.`,
        `Forgotten your password? Reset it at ${base}/auth/forgot-password.`,
      ];
      if (owing > 0) {
        lines.splice(1, 0, `Our records show $${owing.toFixed(2)} still outstanding for this semester — please arrange payment.`);
      }

      const res = await sendMessage({
        channels,
        recipients: [{
          name: s.fullName,
          email: deliverableEmail ? s.email : "",
          phone: s.phone,
        }],
        subject: "Your housing records have been updated",
        body: lines.join("\n"),
      });
      emailSent += res.emailSent;
      smsSent += res.smsSent;
      failed += res.failed;
    }

    await audit({
      action: "owner.august_notices_sent",
      metadata: { students: students.length, emailSent, smsSent, failed, skippedNoContact },
    });

    return {
      success: true,
      message:
        `${students.length} students — ${emailSent} emails, ${smsSent} SMS delivered` +
        (failed ? `, ${failed} sends failed (see logs; fix the email domain / SMS sender ID)` : "") +
        (skippedNoContact ? `, ${skippedNoContact} skipped with no contact on file` : "") + ".",
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export interface CredentialsBatchResult {
  sent: number;
  failed: number;
  remaining: number;
  errors: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * How long to leave a student alone after texting them. Sending ROTATES the
 * password, so a reminded student still looks "never signed in" — without a
 * cooldown the same people would be texted again on every run, and the batch
 * loop would never terminate.
 */
const REMINDER_COOLDOWN_HOURS = 6;

/**
 * Students who were sent a login but have never used it: their account is
 * still on the temporary password we issued. `phone` must be present — this
 * reminder goes out by SMS, and roster-imported students with no contact
 * details on file cannot be reached at all.
 */
function notSignedInWhere(cutoff: Date) {
  return {
    status: StudentStatus.ACTIVE,
    id: { not: "test_profile_seed" },
    phone: { not: "" },
    user: { role: UserRole.STUDENT, isActive: true, mustChangePassword: true },
    OR: [{ credentialsSentAt: null }, { credentialsSentAt: { lt: cutoff } }],
  };
}

function reminderCutoff(): Date {
  return new Date(Date.now() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000);
}

/** The sign-in link the SMS will contain, so the owner can sanity-check it. */
export async function portalLoginUrl(): Promise<string> {
  await requireRole("OWNER");
  return portalSignInUrl();
}

/**
 * Text a fresh temporary password to students who have never signed in.
 *
 * SMS only: they already have the email, and the ones who never opened it are
 * exactly the ones a second email would not reach. Each send rotates to a new
 * password so what arrives always works. Batched, because dozens of sends do
 * not fit in one serverless slice — the client calls this until `remaining`
 * reaches 0.
 *
 * Refuses to run when no SMS provider is configured. The provider falls back
 * to a mock that reports success, so without this check the dashboard would
 * cheerfully report "texted 66 students" having sent nothing at all.
 */
export async function remindNotSignedInBatchAction(
  limit = 5,
): Promise<CredentialsBatchResult> {
  await requireRole("OWNER");

  if (!smsProviderStatus().configured) {
    const remaining = await prisma.studentProfile.count({ where: notSignedInWhere(reminderCutoff()) });
    return {
      sent: 0,
      failed: 0,
      remaining,
      errors: [
        "No SMS provider is configured, so nothing was sent. Set SMSPOP_API_KEY and SMSPOP_SENDER_ID, then try again.",
      ],
    };
  }

  const where = notSignedInWhere(reminderCutoff());

  const batch = await prisma.studentProfile.findMany({
    where,
    orderBy: { fullName: "asc" },
    take: Math.min(Math.max(limit, 1), 10),
    select: { id: true, fullName: true },
  });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < batch.length; i++) {
    const s = batch[i];
    const r = await sendStudentCredentials(s.id, {
      channels: { email: false, sms: true },
    });
    if (r.sms) sent++;
    else {
      failed++;
      errors.push(`${s.fullName}: ${r.error ?? "SMS not delivered"}`);
    }
    if (i < batch.length - 1) await sleep(1200); // gentle on the SMS provider
  }

  const remaining = await prisma.studentProfile.count({ where: notSignedInWhere(reminderCutoff()) });

  revalidatePath("/owner/intake");
  return { sent, failed, remaining, errors };
}
