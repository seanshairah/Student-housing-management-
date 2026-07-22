"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, KeyRound, Eye, EyeOff, AlertCircle } from "lucide-react";
import { changePasswordAction } from "@/app/change-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types";

export function ChangePasswordForm({ tempHint = true }: { tempHint?: boolean }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    changePasswordAction,
    null,
  );
  const errorMessage = state && !state.success ? state.error : null;

  useEffect(() => {
    if (state?.success) {
      toast.success("Password updated");
      const dest = (state.data as { redirect?: string })?.redirect || "/";
      router.push(dest);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
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

      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">
          {tempHint ? "Temporary password" : "Current password"}
        </Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder={tempHint ? "The password we sent you" : "••••••••"}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide passwords" : "Show passwords"}
            aria-pressed={show}
            tabIndex={-1}
            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          required
        />
      </div>

      <Button type="submit" variant="brand" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {pending ? "Updating..." : "Set new password"}
      </Button>
    </form>
  );
}
