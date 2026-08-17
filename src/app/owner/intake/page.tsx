import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { IntakeConsole } from "@/components/owner/intake-console";
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

  const [studentCount, unsentCount, mufudzi] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.studentProfile.count({ where: { credentialsSentAt: null } }),
    prisma.house.findUnique({ where: { slug: "mufudzi" }, select: { id: true } }),
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
    </div>
  );
}
