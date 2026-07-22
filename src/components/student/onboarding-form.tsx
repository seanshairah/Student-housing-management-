"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { completeOnboardingAction } from "@/app/student/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { RENT_TIERS } from "@/constants/rent";
import type { ActionResult } from "@/types";

export interface OnboardingDefaults {
  phone?: string | null;
  roomNumber?: string | null;
  roomTier?: string | null;
  nationalId?: string | null;
  age?: number | null;
  gender?: string | null;
  institution?: string | null;
  program?: string | null;
  yearOfStudy?: string | null;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinRelation?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  transportOptIn?: boolean | null;
}

export function OnboardingForm({ defaults }: { defaults: OnboardingDefaults }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    completeOnboardingAction,
    null,
  );
  const errorMessage = state && !state.success ? state.error : null;

  useEffect(() => {
    if (state?.success) {
      toast.success("Onboarding complete — welcome!");
      router.push((state.data as { redirect?: string })?.redirect || "/student");
      router.refresh();
    }
  }, [state, router]);

  const v = (x: string | number | null | undefined) =>
    x === null || x === undefined ? "" : String(x);

  return (
    <form action={formAction} className="space-y-6">
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Your details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number *</Label>
            <Input id="phone" name="phone" defaultValue={v(defaults.phone)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nationalId">National ID</Label>
            <Input id="nationalId" name="nationalId" defaultValue={v(defaults.nationalId)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age">Age</Label>
            <Input id="age" name="age" type="number" min={16} max={99} defaultValue={v(defaults.age)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <Select id="gender" name="gender" defaultValue={v(defaults.gender)}>
              <option value="">Prefer not to say</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="institution">Institution</Label>
            <Input id="institution" name="institution" placeholder="e.g. University of Zimbabwe" defaultValue={v(defaults.institution)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="program">Program</Label>
            <Input id="program" name="program" placeholder="e.g. BSc Accounting" defaultValue={v(defaults.program)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yearOfStudy">Year of study</Label>
            <Input id="yearOfStudy" name="yearOfStudy" placeholder="e.g. 2" defaultValue={v(defaults.yearOfStudy)} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Your room</h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          Enter the room you&apos;ve been given and whether it&apos;s single or
          sharing. The owner will confirm it.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="roomNumber">Room number / name *</Label>
            <Input
              id="roomNumber"
              name="roomNumber"
              placeholder="e.g. 5 or Room B"
              defaultValue={v(defaults.roomNumber)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roomTier">Room type *</Label>
            <Select
              id="roomTier"
              name="roomTier"
              defaultValue={v(defaults.roomTier)}
              required
            >
              <option value="" disabled>
                Select room type
              </option>
              {RENT_TIERS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2.5 rounded-xl border border-border p-3 text-sm">
          <input
            type="checkbox"
            name="transportOptIn"
            defaultChecked={Boolean(defaults.transportOptIn)}
            className="size-4 rounded border-border"
          />
          <span>
            Add the <strong>transport service</strong> — $15/month
          </span>
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Next of kin</h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          Someone we can contact in case of emergency.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nextOfKinName">Full name *</Label>
            <Input id="nextOfKinName" name="nextOfKinName" defaultValue={v(defaults.nextOfKinName)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nextOfKinPhone">Phone number *</Label>
            <Input id="nextOfKinPhone" name="nextOfKinPhone" defaultValue={v(defaults.nextOfKinPhone)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nextOfKinRelation">Relationship</Label>
            <Input id="nextOfKinRelation" name="nextOfKinRelation" placeholder="e.g. Parent, Sibling" defaultValue={v(defaults.nextOfKinRelation)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guardianName">Guardian name</Label>
            <Input id="guardianName" name="guardianName" defaultValue={v(defaults.guardianName)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guardianPhone">Guardian phone</Label>
            <Input id="guardianPhone" name="guardianPhone" defaultValue={v(defaults.guardianPhone)} />
          </div>
        </div>
      </section>

      <Button type="submit" variant="brand" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {pending ? "Saving..." : "Complete onboarding"}
      </Button>
    </form>
  );
}
