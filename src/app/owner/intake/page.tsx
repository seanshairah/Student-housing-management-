import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { IntakeConsole } from "@/components/owner/intake-console";
import { RemindSignInPanel } from "@/components/owner/remind-signin-panel";
import { loginUrl } from "@/services/students";
import { smsProviderStatus } from "@/services/sms";
import { MUFUDZI_INTAKE } from "@/data/mufudzi-intake";
// Server-side only: the roster carries student emails/phones and must never
// reach a client bundle — the console gets counts, not rows.
import { MUFUDZI_AUGUST } from "@/data/mufudzi-august";

export const metadata = { title: "Student intake" };
export const dynamic = "force-dynamic";
// The August import rebuilds 80 ledgers; give the action room beyond the
// default serverless slice. It is resumable regardless.
export const maxDuration = 60;

export default async function IntakePage() {
  await requireRole("OWNER");

  const [studentCount, unsentCount, mufudzi, neverSignedIn, dueReminder] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.studentProfile.count({ where: { credentialsSentAt: null } }),
    prisma.house.findUnique({ where: { slug: "mufudzi" }, select: { id: true } }),
    // Sent a login but never used it, and reachable by SMS.
    prisma.studentProfile.count({
      where: {
        status: "ACTIVE",
        id: { not: "test_profile_seed" },
        phone: { not: "" },
        user: { role: "STUDENT", isActive: true, mustChangePassword: true },
      },
    }),
    // Of those, the ones not texted in the last 6 hours — i.e. who a reminder
    // would actually go to right now.
    prisma.studentProfile.count({
      where: {
        status: "ACTIVE",
        id: { not: "test_profile_seed" },
        phone: { not: "" },
        user: { role: "STUDENT", isActive: true, mustChangePassword: true },
        OR: [
          { credentialsSentAt: null },
          { credentialsSentAt: { lt: new Date(Date.now() - 6 * 60 * 60 * 1000) } },
        ],
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student intake"
        description="Bulk-onboard students, then send them their portal logins. Later, single students onboard the same way via application approval."
      />
      <IntakeConsole
        intakeCount={MUFUDZI_INTAKE.length}
        augustCount={MUFUDZI_AUGUST.length}
        studentCount={studentCount}
        unsentCount={unsentCount}
        mufudziExists={Boolean(mufudzi)}
      />

      <RemindSignInPanel
        pending={dueReminder}
        neverSignedIn={neverSignedIn}
        loginUrl={loginUrl()}
        smsConfigured={smsProviderStatus().configured}
      />
    </div>
  );
}
