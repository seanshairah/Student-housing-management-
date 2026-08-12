import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { IntakeConsole } from "@/components/owner/intake-console";
import { MUFUDZI_INTAKE } from "@/data/mufudzi-intake";

export const metadata = { title: "Student intake" };
export const dynamic = "force-dynamic";

export default async function IntakePage() {
  await requireRole("OWNER");

  const [studentCount, unsentCount, mufudzi, houses] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.studentProfile.count({ where: { credentialsSentAt: null } }),
    prisma.house.findUnique({ where: { slug: "mufudzi" }, select: { id: true } }),
    prisma.house.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student intake"
        description="Add students one at a time or bulk-onboard a roster, then send them their portal logins."
      />
      <IntakeConsole
        intakeCount={MUFUDZI_INTAKE.length}
        studentCount={studentCount}
        unsentCount={unsentCount}
        mufudziExists={Boolean(mufudzi)}
        houses={houses}
      />
    </div>
  );
}
