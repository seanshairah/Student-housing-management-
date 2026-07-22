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
  type BulkStudentRow,
} from "@/services/students";
import { sendTemplatedEmail } from "@/services/email";
import { sendStatusSMS } from "@/services/sms";
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
