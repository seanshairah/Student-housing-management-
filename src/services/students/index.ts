import { prisma } from "@/lib/prisma";
import {
  PaymentMethod,
  PaymentStatus,
  StudentStatus,
  UserRole,
  type Prisma,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { generateTempPassword, generateReference, formatCurrency } from "@/lib/utils";
import { createInvoice, updateInvoiceAfterPayment } from "@/services/invoices";
import { createReceipt } from "@/services/receipts";
import { sendTemplatedEmail } from "@/services/email";
import { sendStatusSMS } from "@/services/sms";
import { EMAIL_SUBJECTS } from "@/constants/messages";
import { audit } from "@/services/audit";

function loginUrl(): string {
  const base = process.env.APP_URL || process.env.NEXTAUTH_URL || "";
  return `${base.replace(/\/$/, "")}/auth/login`;
}

export interface CreateStudentAccountInput {
  fullName: string;
  email: string;
  phone?: string | null;
  houseId?: string | null;
  roomId?: string | null;
  status?: StudentStatus;
  /** Booking deposit already paid (recorded as a paid CASH invoice/receipt). */
  deposit?: number | null;
}

export interface CreatedStudent {
  userId: string;
  studentProfileId: string;
  fullName: string;
  email: string;
  tempPassword: string;
}

/**
 * Provision a full student account: a User (role STUDENT) with a temporary
 * password + `mustChangePassword`, a StudentProfile, and — if a deposit was
 * paid — a matching paid invoice + receipt so it shows on their account.
 *
 * This is the single canonical "create a student" routine, reused by the owner
 * add-student flow and the bulk intake. Runs inside the given transaction so a
 * failure rolls the whole account back. Returns the temporary password so
 * credentials can be sent.
 */
export async function createStudentAccount(
  input: CreateStudentAccountInput,
  tx: Prisma.TransactionClient,
): Promise<CreatedStudent> {
  const email = input.email.toLowerCase().trim();
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  // Reuse an existing user by email (reset their password) rather than
  // creating a duplicate — email is unique.
  const existingUser = await tx.user.findUnique({ where: { email } });
  const user = existingUser
    ? await tx.user.update({
        where: { id: existingUser.id },
        data: {
          name: input.fullName,
          phone: input.phone ?? undefined,
          role: UserRole.STUDENT,
          isActive: true,
          passwordHash,
          mustChangePassword: true,
        },
      })
    : await tx.user.create({
        data: {
          email,
          name: input.fullName,
          phone: input.phone ?? null,
          role: UserRole.STUDENT,
          passwordHash,
          mustChangePassword: true,
        },
      });

  const profile = await tx.studentProfile.upsert({
    where: { userId: user.id },
    update: {
      fullName: input.fullName,
      email,
      phone: input.phone ?? "",
      houseId: input.houseId ?? undefined,
      roomId: input.roomId ?? undefined,
    },
    create: {
      userId: user.id,
      fullName: input.fullName,
      email,
      phone: input.phone ?? "",
      houseId: input.houseId ?? null,
      roomId: input.roomId ?? null,
      status: input.status ?? StudentStatus.ACTIVE,
    },
  });

  // Record the paid booking deposit as a paid invoice + payment + receipt so it
  // reflects in the student's balance and payment history.
  if (input.deposit && input.deposit > 0) {
    const invoice = await createInvoice(
      {
        studentProfileId: profile.id,
        description: "Booking deposit",
        amount: input.deposit,
      },
      tx,
    );
    const payment = await tx.payment.create({
      data: {
        reference: generateReference("DEP"),
        studentProfileId: profile.id,
        invoiceId: invoice.id,
        amount: input.deposit,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });
    await createReceipt(payment.id, input.deposit, tx);
    await updateInvoiceAfterPayment(invoice.id, tx);
  }

  return {
    userId: user.id,
    studentProfileId: profile.id,
    fullName: input.fullName,
    email,
    tempPassword,
  };
}

/**
 * (Re)issue login credentials to a student: generate a fresh temporary
 * password, force a change on next login, and send it by email + SMS. Because
 * the stored password is hashed and can't be read back, "resend credentials"
 * always rotates to a new temporary password so what we send is guaranteed to
 * work. Best-effort sends; returns which channels succeeded.
 */
export async function sendStudentCredentials(studentProfileId: string): Promise<{
  ok: boolean;
  email: boolean;
  sms: boolean;
  error?: string;
}> {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: { user: true },
  });
  if (!profile || !profile.user) {
    return { ok: false, email: false, sms: false, error: "Student not found" };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  await prisma.user.update({
    where: { id: profile.userId },
    data: { passwordHash, mustChangePassword: true, isActive: true },
  });

  const data = {
    studentName: profile.fullName,
    email: profile.email,
    password: tempPassword,
    loginUrl: loginUrl(),
  };

  const emailRes = await sendTemplatedEmail(
    profile.email,
    EMAIL_SUBJECTS.credentialsIssued,
    "credentialsIssued",
    data,
  ).catch(() => ({ ok: false }) as { ok: boolean });

  let smsOk = false;
  if (profile.phone) {
    const smsRes = await sendStatusSMS(profile.phone, "credentialsIssued", data).catch(
      () => ({ ok: false }) as { ok: boolean },
    );
    smsOk = Boolean(smsRes.ok);
  }

  await prisma.studentProfile
    .update({
      where: { id: profile.id },
      data: { credentialsSentAt: new Date() },
    })
    .catch(() => undefined);

  await audit({
    action: "student.credentials_sent",
    entityType: "StudentProfile",
    entityId: profile.id,
    metadata: { email: Boolean(emailRes.ok), sms: smsOk, hasPhone: Boolean(profile.phone) },
  });

  return { ok: Boolean(emailRes.ok) || smsOk, email: Boolean(emailRes.ok), sms: smsOk };
}

export interface BulkStudentRow {
  fullName: string;
  email: string;
  phone?: string | null;
  deposit?: number | null;
}

export interface BulkImportResult {
  created: CreatedStudent[];
  skipped: { row: BulkStudentRow; reason: string }[];
}

/**
 * Create many student accounts. Each student is created in its own transaction
 * so one bad row can't roll back the whole batch. Does NOT send credentials —
 * that's a separate, deliberate step (see sendStudentCredentials).
 */
export async function bulkCreateStudents(
  rows: BulkStudentRow[],
  opts?: { houseId?: string | null; status?: StudentStatus; sendCredentials?: boolean },
): Promise<BulkImportResult> {
  const created: CreatedStudent[] = [];
  const skipped: { row: BulkStudentRow; reason: string }[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const email = (row.email || "").toLowerCase().trim();
    if (!row.fullName?.trim() || !email) {
      skipped.push({ row, reason: "Missing name or email" });
      continue;
    }
    if (seen.has(email)) {
      skipped.push({ row, reason: "Duplicate email in list" });
      continue;
    }
    seen.add(email);
    try {
      const result = await prisma.$transaction(
        (tx) =>
          createStudentAccount(
            {
              fullName: row.fullName.trim(),
              email,
              phone: row.phone ?? null,
              houseId: opts?.houseId ?? null,
              status: opts?.status,
              deposit: row.deposit ?? null,
            },
            tx,
          ),
        { maxWait: 10000, timeout: 20000 },
      );
      created.push(result);
      // Send login credentials immediately after the portal is created
      // (best-effort — outside the transaction so a send failure can't roll
      // back the account).
      if (opts?.sendCredentials) {
        await sendStudentCredentials(result.studentProfileId).catch(() => undefined);
      }
    } catch (e) {
      skipped.push({ row, reason: (e as Error).message });
    }
  }

  await audit({
    action: "student.bulk_imported",
    entityType: "StudentProfile",
    metadata: { created: created.length, skipped: skipped.length },
  });

  return { created, skipped };
}

/** Total deposit helper for summaries. */
export function formatDepositTotal(rows: BulkStudentRow[]): string {
  return formatCurrency(rows.reduce((s, r) => s + (r.deposit || 0), 0));
}
