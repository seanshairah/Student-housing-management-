"use client";

import { useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { LoginMascots, type MascotMode } from "@/components/auth/login-mascots";
import { LoginForm } from "@/components/forms/login-form";

/**
 * Two-panel login: a playful mascot illustration on the side (left on desktop,
 * a band on top for mobile) and the form, sharing focus state so the mascots
 * react as you fill it in.
 */
export function LoginExperience({ next }: { next?: string }) {
  const [mode, setMode] = useState<MascotMode>("idle");

  return (
    <div className="grid lg:grid-cols-2">
      {/* Illustration panel */}
      <aside className="relative flex min-h-[190px] flex-col overflow-hidden bg-gradient-to-br from-muted/80 via-muted/40 to-background p-6 lg:min-h-[560px] lg:p-8">
        <div className="hidden lg:block">
          <p className="font-display text-2xl font-bold tracking-tight">Welcome home.</p>
          <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
            Sign in to manage your student housing — applications, payments and
            messages, all in one place.
          </p>
        </div>
        <div className="flex flex-1 items-end justify-center pt-4">
          <LoginMascots mode={mode} />
        </div>
        <p className="absolute bottom-4 left-6 hidden text-xs font-semibold text-muted-foreground lg:block">
          BlessBri Properties
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex flex-col justify-center p-7 sm:p-9">
        <div className="mb-6">
          <div className="mb-3 flex size-11 items-center justify-center rounded-2xl gradient-brand text-white shadow-md">
            <Home className="size-5" />
          </div>
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your Student Housing account
          </p>
        </div>

        <LoginForm next={next} onMode={setMode} />

        {process.env.NODE_ENV !== "production" && (
          <div className="mt-6 rounded-xl bg-muted/60 p-3.5 text-xs text-muted-foreground">
            <p className="mb-1.5 font-semibold text-foreground">Demo accounts</p>
            <ul className="space-y-0.5">
              <li>Owner — owner@studenthousing.local / owner123</li>
              <li>Student — student@studenthousing.local / student123</li>
              <li>Caretaker — caretaker@studenthousing.local / caretaker123</li>
            </ul>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have a room yet?{" "}
          <Link href="/book" className="font-semibold text-primary hover:underline">
            Apply now
          </Link>
        </p>
      </div>
    </div>
  );
}
