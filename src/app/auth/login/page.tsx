import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession, homeForRole } from "@/lib/auth";
import { LoginExperience } from "@/components/auth/login-experience";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));
  const { next } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-background to-sand-50 px-4 py-10">
      <div className="absolute -left-24 top-10 size-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute -right-24 bottom-10 size-72 rounded-full bg-sand-200/40 blur-3xl" />

      <div className="relative w-full max-w-4xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>

        <div className="overflow-hidden rounded-3xl border border-brand-100/70 bg-card shadow-xl">
          <LoginExperience next={next} />
        </div>
      </div>
    </div>
  );
}
