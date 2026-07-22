"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { RoomStatus } from "@prisma/client";
import { rentTierByKey } from "@/constants/rent";
import type { ActionResult } from "@/types";

/**
 * Complete a student's onboarding: capture their personal details, next-of-kin,
 * and the room they've been given (number + sharing type). The room is
 * created/matched in their house and its monthly rent is set from the tier.
 * Stamps `onboardingCompletedAt` so the onboarding gate lifts.
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
  const roomNumber = str("roomNumber");
  const tier = rentTierByKey(str("roomTier"));

  if (phone.length < 7) {
    return { success: false, error: "Please enter a valid phone number." };
  }
  if (!roomNumber) {
    return { success: false, error: "Please enter your room number/name." };
  }
  if (!tier) {
    return { success: false, error: "Please choose your room type." };
  }
  if (!nextOfKinName) {
    return { success: false, error: "Please enter your next-of-kin's name." };
  }
  if (nextOfKinPhone.length < 7) {
    return { success: false, error: "Please enter a valid next-of-kin phone number." };
  }
  if (!profile.houseId) {
    return {
      success: false,
      error: "No house is assigned to your account yet — please contact the owner.",
    };
  }

  const ageRaw = str("age");
  const age = ageRaw ? Number(ageRaw) : null;

  try {
    await prisma.$transaction(async (tx) => {
      // Find or create the room the student identifies, in their house.
      let room = await tx.room.findFirst({
        where: { houseId: profile.houseId!, number: roomNumber },
      });
      if (!room) {
        room = await tx.room.create({
          data: {
            houseId: profile.houseId!,
            number: roomNumber,
            type: tier.roomType,
            capacity: tier.capacity,
            price: tier.monthlyRent ?? 0,
            occupied: 0,
            status: RoomStatus.AVAILABLE,
          },
        });
      }

      // Assign the student to the room (only adjust occupancy on a real move).
      if (profile.roomId !== room.id) {
        if (profile.roomId) {
          const old = await tx.room.findUnique({ where: { id: profile.roomId } });
          if (old) {
            const occ = Math.max(0, old.occupied - 1);
            await tx.room.update({
              where: { id: old.id },
              data: {
                occupied: occ,
                status: occ === 0 ? RoomStatus.AVAILABLE : old.status,
              },
            });
          }
        }
        const occ = room.occupied + 1;
        await tx.room.update({
          where: { id: room.id },
          data: {
            occupied: occ,
            status: occ >= room.capacity ? RoomStatus.OCCUPIED : RoomStatus.RESERVED,
          },
        });
      }

      await tx.studentProfile.update({
        where: { id: profile.id },
        data: {
          phone,
          roomId: room.id,
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
    });
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }

  revalidatePath("/student");
  revalidatePath("/student/profile");
  revalidatePath("/student/room");
  return { success: true, data: { redirect: "/student" } };
}
