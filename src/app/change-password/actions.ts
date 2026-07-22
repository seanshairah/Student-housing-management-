"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  hashPassword,
  verifyPassword,
  createSession,
  homeForRole,
} from "@/lib/auth";
import { audit } from "@/services/audit";
import type { ActionResult } from "@/types";

/**
 * Set a new password for the signed-in user and clear the
 * `mustChangePassword` flag. Used by the forced first-login change-password
 * screen (auto-provisioned accounts) and can be reused for a normal
 * "change my password" flow.
 */
export async function changePasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUser();

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: "The two passwords don't match." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { success: false, error: "Account not found." };

  // Verify the current/temporary password so a hijacked session can't silently
  // change the password.
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) {
    return {
      success: false,
      error: "Your current (temporary) password is incorrect.",
    };
  }

  if (await verifyPassword(newPassword, user.passwordHash)) {
    return {
      success: false,
      error: "Please choose a password different from your temporary one.",
    };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  // Re-issue the session cookie so the JWT no longer carries the
  // must-change-password claim (the middleware gate reads it from the token).
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: false,
  });

  await audit({
    userId: user.id,
    actorEmail: user.email,
    action: "auth.password_changed",
  });

  return { success: true, data: { redirect: homeForRole(user.role) } };
}
