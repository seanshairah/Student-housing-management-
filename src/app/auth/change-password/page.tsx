import { redirect } from "next/navigation";

/**
 * Defensive redirect stub.
 *
 * This platform's forced-password-change page lives at /change-password; the
 * sibling platform uses /auth/change-password. A stale wrong reference to the
 * sibling's path — from an old client bundle, a bookmarked link, or a future
 * copy-paste — used to 404 here, which read to a signed-in user as "the site
 * is broken." There is no reason that path should ever dead-end on this
 * platform, so it now simply forwards to the real page. Costs nothing and
 * closes the failure mode for good.
 */
export default function AuthChangePasswordRedirect() {
  redirect("/change-password");
}
