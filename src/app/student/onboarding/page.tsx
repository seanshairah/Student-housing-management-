import { redirect } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingForm } from "@/components/student/onboarding-form";

export const metadata = { title: "Complete your onboarding" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!profile) redirect("/student");
  if (profile.onboardingCompletedAt) redirect("/student");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-2xl gradient-brand text-white">
          <PartyPopper className="size-6" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Welcome, {profile.fullName.split(" ")[0]}!
        </h1>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
          Let&apos;s finish setting up your account. Fill in your details and
          next-of-kin information to complete onboarding. Your room will be
          confirmed by the house owner.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <OnboardingForm
            defaults={{
              phone: profile.phone,
              nationalId: profile.nationalId,
              age: profile.age,
              gender: profile.gender,
              institution: profile.institution,
              program: profile.program,
              yearOfStudy: profile.yearOfStudy,
              nextOfKinName: profile.nextOfKinName,
              nextOfKinPhone: profile.nextOfKinPhone,
              nextOfKinRelation: profile.nextOfKinRelation,
              guardianName: profile.guardianName,
              guardianPhone: profile.guardianPhone,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
