import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  DashboardShell,
  type ShellNavItem,
} from "@/components/navigation/dashboard-shell";

const NAV: ShellNavItem[] = [
  { label: "Home", href: "/student", icon: "Home" },
  { label: "Payments", href: "/student/payments", icon: "CreditCard" },
  { label: "Room", href: "/student/room", icon: "DoorOpen" },
  { label: "Messages", href: "/student/messages", icon: "MessageSquare" },
  { label: "Profile", href: "/student/profile", icon: "User" },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    select: { fullName: true, email: true },
  });

  const user = {
    name: profile?.fullName ?? session.name,
    email: profile?.email ?? session.email,
  };

  return (
    <DashboardShell
      nav={NAV}
      mobileNav={NAV}
      brand="Student Housing"
      roleLabel="Student"
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
