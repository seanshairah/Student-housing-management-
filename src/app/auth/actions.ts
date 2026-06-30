"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSession,
  destroySession,
  homeForRole,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { audit } from "@/services/audit";
import type { ActionResult } from "@/types";

/**
 * A valid bcrypt hash of a throwaway string. When an email doesn't exist we
 * still run a password comparison against this so a missing account takes the
 * same time as a wrong password — closing the timing side-channel that would
 * otherwise let an attacker enumerate which emails are registered.
 */
const DUMMY_HASH =
  "$2a$10$vIHaYaTrXi55tsQpGNrpZOcUnBw99D7mzAr7guofXHYPX13mMOIZi";

const FAILED_ACTION = "auth.login_failed";
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 7; // failures within the window before a temporary lock

function clientIp(h: Headers): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Count recent failed attempts for this email (DB-backed, works across
 *  serverless instances since it reads the shared audit log). */
async function recentFailures(email: string): Promise<number> {
  try {
    return await prisma.auditLog.count({
      where: {
        action: FAILED_ACTION,
        actorEmail: email,
        createdAt: { gt: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
      },
    });
  } catch {
    return 0; // never let the limiter break login on a transient DB hiccup
  }
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const ip = clientIp(await headers());

  // ── Rate limit: temporarily lock the account after too many failures ──
  if ((await recentFailures(email)) >= MAX_ATTEMPTS) {
    return {
      success: false,
      error:
        "Too many failed attempts. For your security, please wait about 15 minutes and try again.",
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run a bcrypt comparison (against the real or a dummy hash) so the
  // response time doesn't reveal whether the account exists.
  const valid = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !user.isActive || !valid) {
    await audit({
      actorEmail: email,
      action: FAILED_ACTION,
      metadata: {
        ip,
        reason: !user
          ? "no_user"
          : !user.isActive
            ? "inactive"
            : "bad_password",
      },
    });
    return { success: false, error: "Invalid email or password." };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  // Clear the failed-attempt counter for this email on a successful sign-in.
  await prisma.auditLog
    .deleteMany({ where: { action: FAILED_ACTION, actorEmail: email } })
    .catch(() => undefined);
  await audit({
    userId: user.id,
    actorEmail: user.email,
    action: "auth.login",
    metadata: { ip },
  });

  return { success: true, data: { redirect: homeForRole(user.role) } };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/auth/login");
}
