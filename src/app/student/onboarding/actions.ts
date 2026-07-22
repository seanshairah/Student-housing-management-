"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/types";

/**
 * Complete a student's onboarding: capture their personal details + next-of-kin
 * and stamp `onboardingCompletedAt` so the onboarding gate lifts. Room
 * assignment is deliberately not collected here — the owner assigns rooms.
 */
export async function completeOnboardingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!profile) return { success: false, error: "Profile not found." };

  const str = (k: string) => String(formData.get(k) || "").trim();

  const phone = str("phone");
  const nextOfKinName = str("nextOfKinName");
  const nextOfKinPhone = str("nextOfKinPhone");

  if (phone.length < 7) {
    return { success: false, error: "Please enter a valid phone number." };
  }
  if (!nextOfKinName) {
    return { success: false, error: "Please enter your next-of-kin's name." };
  }
  if (nextOfKinPhone.length < 7) {
    return { success: false, error: "Please enter a valid next-of-kin phone number." };
  }

  const ageRaw = str("age");
  const age = ageRaw ? Number(ageRaw) : null;

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: {
      phone,
      nationalId: str("nationalId") || null,
      age: age && Number.isFinite(age) && age > 0 && age < 120 ? age : null,
      gender: str("gender") || null,
      institution: str("institution") || null,
      program: str("program") || null,
      yearOfStudy: str("yearOfStudy") || null,
      nextOfKinName,
      nextOfKinPhone,
      nextOfKinRelation: str("nextOfKinRelation") || null,
      guardianName: str("guardianName") || null,
      guardianPhone: str("guardianPhone") || null,
      onboardingCompletedAt: new Date(),
    },
  });

  revalidatePath("/student");
  revalidatePath("/student/profile");
  return { success: true, data: { redirect: "/student" } };
}
