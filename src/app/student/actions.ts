"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import {
  startMobilePayment,
  verifyAndSettle,
  type MobileMethod,
} from "@/services/payments";
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
  amount?: number; // used for transport (student-entered)
}): Promise<MobilePayResult> {
  const session = await requireRole("STUDENT");
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: { room: true },
    });
    if (!profile) return { success: false, error: "No student profile found." };

    const isWeb = input.method === "web";
    if (!isWeb) {
      const digits = (input.phone || "").replace(/\D/g, "");
      if (digits.length < 9)
        return { success: false, error: "Enter a valid mobile number." };
      if (input.method !== "ecocash" && input.method !== "onemoney")
        return { success: false, error: "Choose a payment method." };
    }

    const roomPrice = profile.room ? toNumber(profile.room.price) : 0;
    let amount = 0;
    let description = "";

    if (input.purpose === "rent_month") {
      amount = roomPrice;
      description = `Rent — next month${profile.room ? ` (Room ${profile.room.number})` : ""}`;
    } else if (input.purpose === "rent_semester") {
      amount = roomPrice * SEMESTER_MONTHS;
      description = `Rent — next semester (${SEMESTER_MONTHS} months)`;
    } else {
      // Transport is student-chosen, but validate + clamp server-side so the
      // client can never submit a zero, negative, or absurd amount.
      amount = Math.round(Number(input.amount || 0) * 100) / 100;
      description = "Transport service";
      if (!Number.isFinite(amount) || amount < 1 || amount > 1000) {
        return {
          success: false,
          error: "Enter a transport amount between $1 and $1000.",
        };
      }
    }

    if (!amount || amount <= 0) {
      return {
        success: false,
        error:
          input.purpose === "transport"
            ? "Enter the transport amount."
            : "No rent amount is set for your room — please contact the owner.",
      };
    }

    const res = await startMobilePayment({
      studentProfileId: profile.id,
      amount,
      description,
      phone: input.phone,
      method: input.method,
    });

    if (!res.ok)
      return { success: false, error: res.error ?? "Could not start the payment." };

    return {
      success: true,
      reference: res.reference,
      instructions: res.instructions,
      redirectUrl: res.redirectUrl,
      amount,
      testMode: res.mode === "development",
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Poll the status of a mobile payment; settles it when Paynow reports paid. */
export async function checkMobilePaymentAction(
  reference: string,
): Promise<{ status: "paid" | "pending" | "failed"; error?: string }> {
  await requireRole("STUDENT");
  const r = await verifyAndSettle(reference);
  if (r.status === "paid") {
    revalidatePath("/student/payments");
    revalidatePath("/student");
  }
  return {
    status: r.status,
    error: r.status === "failed" ? r.providerStatus : undefined,
  };
}

/**
 * Checkout "Pay now". Verifies the payment against Paynow before settling — it
 * NEVER blindly marks a payment paid. In development the mock poll returns paid
 * (so the simulated checkout completes); in live it only settles once Paynow
 * actually confirms, so this button can't be used to settle for free.
 */
export async function payNowAction(reference: string): Promise<ActionResult> {
  await requireRole("STUDENT");
  if (!reference) return { success: false, error: "Missing payment reference" };
  try {
    const r = await verifyAndSettle(reference);
    revalidatePath("/student/payments");
    revalidatePath("/student");
    if (r.status === "paid") return { success: true };
    if (r.status === "failed")
      return { success: false, error: r.providerStatus ?? "Payment failed." };
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
  await requireRole("STUDENT");
  if (!reference) return { success: false, error: "Missing payment reference" };
  try {
    await verifyAndSettle(reference);
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
