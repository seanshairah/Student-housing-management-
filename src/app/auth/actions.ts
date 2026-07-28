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
import {
  rateLimit,
  clearRateLimit,
  pruneRateLimits,
  LOGIN_LIMIT,
} from "@/core/auth/rate-limit";
import {
  createPasswordReset,
  redeemPasswordReset,
  resetUrl,
  prunePasswordResets,
} from "@/core/auth/password-reset";
import { sendTemplatedEmail } from "@/services/email";
import { EMAIL_SUBJECTS } from "@/constants/messages";
import type { ActionResult } from "@/types";

/**
 * A valid bcrypt hash of a throwaway string. When an email doesn't exist we
 * still run a password comparison against this so a missing account takes the
 * same time as a wrong password — closing the timing side-channel that would
 * otherwise let an attacker enumerate which emails are registered.
 */
const DUMMY_HASH =
  "$2a$10$vIHaYaTrXi55tsQpGNrpZOcUnBw99D7mzAr7guofXHYPX13mMOIZi";


function clientIp(h: Headers): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
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
  // Shared with the other platform (core/auth/rate-limit). This used to count
  // rows in the audit log, which mixed the audit trail with a throttle and grew
  // without bound.
  const limitKey = `login:${email}`;
  await pruneRateLimits();
  const gate = await rateLimit({ key: limitKey, ...LOGIN_LIMIT });
  if (!gate.allowed) {
    const minutes = Math.ceil(gate.retryAfterSeconds / 60);
    return {
      success: false,
      error: `Too many sign-in attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
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
      action: "auth.login.failed",
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
    mustChangePassword: user.mustChangePassword,
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  // Clear the throttle for this email on a successful sign-in. Note this no
  // longer deletes audit rows: the previous version wiped the record of failed
  // attempts on every success, which is exactly the history you want kept.
  await clearRateLimit(limitKey);
  await audit({
    userId: user.id,
    actorEmail: user.email,
    action: "auth.login",
    metadata: { ip },
  });

  return {
    success: true,
    data: {
      redirect: user.mustChangePassword
        ? "/change-password"
        : homeForRole(user.role),
    },
  };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/auth/login");
}

/**
 * "I forgot my password" — issue a reset link.
 *
 * Always reports success, whatever happened. Saying "no account with that
 * email" would let anyone test which addresses are registered, and the student
 * roll is exactly the list an attacker would want.
 */
export async function requestPasswordResetAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const GENERIC =
    "If that email is registered, we've sent a reset link. Please check your inbox.";

  if (!email || !email.includes("@")) {
    return { success: false, error: "Enter the email address on your account." };
  }

  // Throttle by email so this can't be used to spam somebody's inbox, and by
  // extension can't be used to probe addresses at speed.
  const gate = await rateLimit({ key: `reset:${email}`, limit: 3, windowSeconds: 15 * 60 });
  if (!gate.allowed) return { success: true, message: GENERIC };

  await prunePasswordResets();

  try {
    const request = await createPasswordReset(email);
    if (request.token) {
      await sendTemplatedEmail(
        request.email,
        EMAIL_SUBJECTS.passwordReset,
        "passwordReset",
        {
          studentName: request.name ?? "there",
          resetUrl: resetUrl(request.token),
        },
      ).catch(() => undefined);
    }
    await audit({ actorEmail: email, action: "auth.password_reset.requested" });
  } catch {
    // Never surface the reason — the response must not vary by outcome.
  }

  return { success: true, message: GENERIC };
}

/** Redeem a reset link and set the new password. */
export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirmPassword") || "");

  if (password !== confirm) {
    return { success: false, error: "The two passwords don't match." };
  }
  if (password.length < 8) {
    return { success: false, error: "Use at least 8 characters." };
  }

  const result = await redeemPasswordReset(token, password);
  if (!result.ok) return { success: false, error: result.error };

  await audit({ action: "auth.password_reset.completed" });
  // Not signed in automatically: possession of an emailed link shouldn't hand
  // out a session. They sign in with the password they just chose.
  return {
    success: true,
    message: "Your password has been changed. You can now sign in.",
  };
}
