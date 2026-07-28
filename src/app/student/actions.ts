"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import {
  createSelfPayment,
  pollAndSettle,
  type MobileMethod,
} from "@/services/payments";
import { type PaymentPurpose } from "@/core/billing/pricing";
import { canAccessPayment } from "@/core/auth/access";
import { rateLimit, PAYMENT_LIMIT } from "@/core/auth/rate-limit";
import { requestRenewal } from "@/services/applications";
import { notifyOwners } from "@/services/notifications";
import { generateReference, toNumber } from "@/lib/utils";
import { serviceRequestSchema } from "@/lib/validators";
import {
  NotificationChannel,
  MessageStatus,
  ServiceRequestCategory,
  ServiceRequestPriority,
} from "@prisma/client";

type ActionResult = { success: boolean; error?: string };

async function getProfile(userId: string) {
  return prisma.studentProfile.findUnique({ where: { userId } });
}

/**
 * Ensure the payment identified by `reference` belongs to the signed-in
 * student. Every payment is bound to a studentProfileId at creation, so this
 * guarantees a student can only ever poll/settle their OWN payment — a
 * reference for another student's payment is rejected before it reaches Paynow
 * or the settlement logic.
 */
/**
 * Does this payment belong to the signed-in student? Delegates to the shared
 * access module so every ownership rule lives in one place across both
 * platforms.
 */
async function ownsPayment(userId: string, reference: string) {
  if (!reference) return false;
  return canAccessPayment({ userId, role: "STUDENT" }, reference);
}

/** Request to renew / extend the stay for the coming term. */
export async function requestRenewalAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("STUDENT");
  try {
    const profile = await getProfile(session.userId);
    if (!profile) throw new Error("Student profile not found");
    if (!profile.roomId) {
      throw new Error("You don't have an active room to renew yet.");
    }
    const roomId = String(formData.get("roomId") || profile.roomId);
    const requestedTerm = String(formData.get("requestedTerm") || "").trim();
    if (!requestedTerm) throw new Error("Please enter the term you're renewing for.");
    const notes = String(formData.get("notes") || "").trim() || undefined;

    await requestRenewal({
      studentProfileId: profile.id,
      roomId,
      requestedTerm,
      notes,
    });
    revalidatePath("/student/room");
    revalidatePath("/student");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Number of months billed for a "semester" rent payment. */
const SEMESTER_MONTHS = 6;

export type PayPurpose = "rent_month" | "rent_semester" | "transport";

/**
 * Map the portal's purpose labels onto the shared core's purposes. The core
 * decides the price for each — the browser no longer sends an amount.
 */
const PURPOSE_MAP: Record<PayPurpose, PaymentPurpose> = {
  rent_month: "RENT_MONTH",
  rent_semester: "RENT_SEMESTER",
  transport: "TRANSPORT_MONTH",
};

export interface MobilePayResult {
  success: boolean;
  error?: string;
  reference?: string;
  instructions?: string;
  redirectUrl?: string;
  amount?: number;
  testMode?: boolean;
}

/**
 * Start a payment for rent (next month / next semester) or transport. Either
 * pushes an EcoCash/OneMoney USSD prompt to the entered number, or (method:
 * "web") returns a Paynow hosted-checkout URL to redirect to.
 */
export async function initiateMobilePaymentAction(input: {
  purpose: PayPurpose;
  phone?: string;
  method: MobileMethod | "web";
}): Promise<MobilePayResult> {
  const session = await requireRole("STUDENT");
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!profile) return { success: false, error: "No student profile found." };

    const purpose = PURPOSE_MAP[input.purpose];
    if (!purpose) return { success: false, error: "Choose what you're paying for." };

    // Every initiation round-trips to Paynow, so cap the rate.
    const gate = await rateLimit({ key: `pay:${profile.id}`, ...PAYMENT_LIMIT });
    if (!gate.allowed) {
      return {
        success: false,
        error: "Too many payment attempts. Please wait a few minutes and try again.",
      };
    }

    if (input.method !== "web" && input.method !== "ecocash" && input.method !== "onemoney") {
      return { success: false, error: "Choose a payment method." };
    }

    // The amount is NOT taken from the request. It used to be, for transport:
    // the browser posted its own figure and the server only clamped it to
    // $1–$1000, so a student could settle a $15 transport charge by sending $1.
    // createSelfPayment prices every purpose from the student's own room and
    // the platform's configured rates.
    const res = await createSelfPayment({
      profileId: profile.id,
      purpose,
      method: input.method,
      phone: input.phone,
    });

    if (!res.ok) {
      return { success: false, error: res.error ?? "Could not start the payment.", reference: res.reference };
    }

    revalidatePath("/student/payments");
    return {
      success: true,
      reference: res.reference,
      instructions: res.instructions,
      redirectUrl: res.redirectUrl,
      amount: res.amount,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Poll the status of a mobile payment; settles it when Paynow reports paid. */
export async function checkMobilePaymentAction(
  reference: string,
): Promise<{ status: "paid" | "pending" | "failed"; error?: string }> {
  const session = await requireRole("STUDENT");
  if (!(await ownsPayment(session.userId, reference))) {
    return { status: "failed", error: "Payment not found." };
  }
  const r = await pollAndSettle(reference);
  if (r.status === "paid") {
    revalidatePath("/student/payments");
    revalidatePath("/student");
  }
  return {
    status: r.status,
    error: r.status === "failed" ? r.message : undefined,
  };
}

/**
 * Checkout "Pay now". Verifies the payment against Paynow before settling — it
 * NEVER blindly marks a payment paid. In development the mock poll returns paid
 * (so the simulated checkout completes); in live it only settles once Paynow
 * actually confirms, so this button can't be used to settle for free.
 */
export async function payNowAction(reference: string): Promise<ActionResult> {
  const session = await requireRole("STUDENT");
  if (!reference) return { success: false, error: "Missing payment reference" };
  if (!(await ownsPayment(session.userId, reference))) {
    return { success: false, error: "Payment not found." };
  }
  try {
    const r = await pollAndSettle(reference);
    revalidatePath("/student/payments");
    revalidatePath("/student");
    if (r.status === "paid") return { success: true };
    if (r.status === "failed")
      return { success: false, error: r.message ?? "Payment failed." };
    return {
      success: false,
      error:
        "We haven't received confirmation from Paynow yet. If you've completed the payment, give it a moment and try again.",
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Verify/settle the payment on the return page. Idempotent. Polls Paynow
 *  first so a user returning without paying isn't falsely marked paid. */
export async function confirmPaymentReturn(
  reference: string,
): Promise<ActionResult> {
  const session = await requireRole("STUDENT");
  if (!reference) return { success: false, error: "Missing payment reference" };
  if (!(await ownsPayment(session.userId, reference))) {
    return { success: false, error: "Payment not found." };
  }
  try {
    await pollAndSettle(reference);
    revalidatePath("/student/payments");
    revalidatePath("/student");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Update editable contact + next-of-kin fields only. */
export async function updateProfileAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("STUDENT");
  try {
    const profile = await getProfile(session.userId);
    if (!profile) return { success: false, error: "Profile not found" };

    const str = (k: string) => {
      const v = formData.get(k);
      return typeof v === "string" ? v.trim() : "";
    };

    const phone = str("phone");
    const email = str("email");
    if (phone.length < 7) return { success: false, error: "Enter a valid phone number" };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return { success: false, error: "Enter a valid email" };

    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        phone,
        email,
        nextOfKinName: str("nextOfKinName") || null,
        nextOfKinPhone: str("nextOfKinPhone") || null,
        nextOfKinRelation: str("nextOfKinRelation") || null,
        guardianName: str("guardianName") || null,
        guardianPhone: str("guardianPhone") || null,
      },
    });

    revalidatePath("/student/profile");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Submit a maintenance / service request for the student's house. */
export async function submitServiceRequestAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("STUDENT");
  try {
    const profile = await getProfile(session.userId);
    if (!profile) return { success: false, error: "Profile not found" };

    const parsed = serviceRequestSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      priority: formData.get("priority"),
      houseId: formData.get("houseId") || profile.houseId || "",
    });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const reference = generateReference("SRV");
    const request = await prisma.serviceRequest.create({
      data: {
        reference,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category as ServiceRequestCategory,
        priority: parsed.data.priority as ServiceRequestPriority,
        houseId: parsed.data.houseId || profile.houseId || null,
        studentProfileId: profile.id,
      },
    });

    await notifyOwners({
      title: "New service request",
      body: `${profile.fullName} submitted "${parsed.data.title}".`,
      type: "service_request",
      link: "/owner/services",
      relatedType: "ServiceRequest",
      relatedId: request.id,
    }).catch(() => undefined);

    revalidatePath("/student/profile");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Send a message to the owner (logged + notification). */
export async function messageOwnerAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("STUDENT");
  try {
    const profile = await getProfile(session.userId);
    const subject =
      (formData.get("subject") as string | null)?.trim() || "Message from student";
    const body = (formData.get("body") as string | null)?.trim() || "";
    if (body.length < 2)
      return { success: false, error: "Please write a short message" };

    await prisma.messageLog.create({
      data: {
        channel: NotificationChannel.DASHBOARD,
        recipient: "owner",
        recipientName: "House Owner",
        subject,
        body,
        status: MessageStatus.SENT,
        senderId: session.userId,
        relatedType: "StudentProfile",
        relatedId: profile?.id,
      },
    });

    await notifyOwners({
      title: `Message from ${session.name}`,
      body: `${subject}: ${body.slice(0, 140)}`,
      type: "message",
      link: "/owner/messages",
      relatedType: "StudentProfile",
      relatedId: profile?.id,
    }).catch(() => undefined);

    revalidatePath("/student/messages");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
