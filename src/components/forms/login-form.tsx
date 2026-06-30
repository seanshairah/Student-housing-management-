"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MascotMode } from "@/components/auth/login-mascots";
import type { ActionResult } from "@/types";

export function LoginForm({
  next,
  onMode,
}: {
  next?: string;
  onMode?: (mode: MascotMode) => void;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    loginAction,
    null,
  );

  const errorMessage = state && !state.success ? state.error : null;

  // Drive the mascots: look up while filling the form, cover eyes for the
  // password (unless it's revealed via the show-password toggle).
  useEffect(() => {
    if (!onMode) return;
    if (focused === "password" && !showPassword) onMode("hidden");
    else if (focused) onMode("typing");
    else onMode("idle");
  }, [focused, showPassword, onMode]);

  useEffect(() => {
    if (state?.success) {
      const dest = next || (state.data as { redirect: string })?.redirect || "/";
      toast.success("Welcome back!");
      router.push(dest);
      router.refresh();
    }
  }, [state, router, next]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Persistent inline error — visible until the next submit */}
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
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
          aria-invalid={errorMessage ? true : undefined}
          className={cn(errorMessage && "border-rose-300 focus-visible:ring-rose-400")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
            aria-invalid={errorMessage ? true : undefined}
            className={cn(
              "pr-11",
              errorMessage && "border-rose-300 focus-visible:ring-rose-400",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            tabIndex={-1}
            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" variant="brand" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
