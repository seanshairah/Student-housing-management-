import { ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "@/components/forms/change-password-form";

export const metadata = { title: "Set your password" };

export default async function ChangePasswordPage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { mustChangePassword: true },
  });
  const forced = Boolean(user?.mustChangePassword);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-background to-sand-50 px-4 py-10">
      <div className="absolute -left-24 top-10 size-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute -right-24 bottom-10 size-72 rounded-full bg-sand-200/40 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-brand-100/70 bg-card p-8 shadow-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl gradient-brand text-white">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {forced ? "Set your new password" : "Change your password"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {forced
                ? "For your security, choose a new password to finish setting up your account."
                : "Enter your current password and choose a new one."}
            </p>
          </div>

          <ChangePasswordForm tempHint={forced} />
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
