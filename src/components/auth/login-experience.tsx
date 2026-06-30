"use client";

import { useState } from "react";
import { LoginMascots, type MascotMode } from "@/components/auth/login-mascots";
import { LoginForm } from "@/components/forms/login-form";

/** Combines the playful mascots with the login form, sharing focus state. */
export function LoginExperience({ next }: { next?: string }) {
  const [mode, setMode] = useState<MascotMode>("idle");
  return (
    <>
      <LoginMascots mode={mode} />
      <LoginForm next={next} onMode={setMode} />
    </>
  );
}
