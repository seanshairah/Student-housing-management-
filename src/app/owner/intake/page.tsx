import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { IntakeConsole } from "@/components/owner/intake-console";
import { MUFUDZI_INTAKE } from "@/data/mufudzi-intake";

export const metadata = { title: "Student intake" };
export const dynamic = "force-dynamic";

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
        studentCount={studentCount}
        unsentCount={unsentCount}
        mufudziExists={Boolean(mufudzi)}
      />
    </div>
  );
}
