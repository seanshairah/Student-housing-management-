import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getSession, homeForRole, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDatabaseBelongsToPlatform } from "@/core/platform";

/**
 * Require an authenticated user. Redirects to login if absent or if the
 * account has since been deactivated, and forces a pending password change
 * before any protected page renders (covers owner, student and caretaker).
 */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  // Before trusting a single row: confirm this deployment is talking to its
  // OWN database. The two platforms have identical schemas, so a copy-pasted
  // DATABASE_URL fails silently and successfully — one brand serving the
  // other's students and money. Memoised to one query per instance.
  await ensureDatabaseBelongsToPlatform(async () => {
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
      select: { platformKey: true },
    });
    return settings?.platformKey;
  });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, mustChangePassword: true },
  });
  if (!user || !user.isActive) redirect("/auth/login");
  // This platform's forced-change page lives at /change-password — the
  // /auth/... spelling is the sibling platform's. Sending people there
  // produced a 404 that read as "the sign-in page is broken": you could log
  // in, but requireUser() bounced you off a cliff before any page rendered.
  if (user.mustChangePassword) redirect("/change-password");

  return session;
}

/** Require a specific role (or one of several). Redirects appropriately. */
export async function requireRole(
  roles: UserRole | UserRole[],
): Promise<SessionPayload> {
  const session = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(session.role)) {
    redirect(homeForRole(session.role));
  }
  return session;
}
