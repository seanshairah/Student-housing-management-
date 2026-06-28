import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/marketing/site-shell";

export const metadata: Metadata = {
  title: "About",
  description:
    "About our student accommodation system — how Mufudzi and Siphiwe House are run, and the standard of care behind every room.",
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Safe & secure",
    description:
      "Controlled access, CCTV in common areas, and on-site caretakers at both houses, day and night.",
  },
  {
    icon: HeartHandshake,
    title: "Genuinely cared for",
    description:
      "A responsive management team that treats every resident like part of the community.",
  },
  {
    icon: Sparkles,
    title: "Comfortable & reliable",
    description:
      "Fast Wi-Fi, backup power, hot water, and regular cleaning so you can focus on your studies.",
  },
  {
    icon: Building2,
    title: "Simple to manage",
    description:
      "Apply online, pay securely, and handle everything from your student portal afterwards.",
  },
];

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 -z-10 size-[28rem] rounded-full bg-brand-200/40 blur-3xl"
        />
        <div className="container py-16 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              About us
            </p>
            <h1 className="mt-3 text-balance font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              A student housing system built around{" "}
              <span className="gradient-text">people</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              We run two welcoming residences — Mufudzi House and Siphiwe House —
              designed to make student life easier. From the first click to
              move-in day, everything is online, transparent, and handled by a
              team that cares.
            </p>
          </div>
        </div>
      </section>

      <section className="container pb-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-4 font-display text-lg font-semibold">
                  {v.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {v.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container py-16">
        <div className="overflow-hidden rounded-3xl gradient-brand px-6 py-12 text-center text-white shadow-lg sm:px-12">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Find your room today
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-brand-50/90">
            Browse our houses, pick an available room, and apply in minutes.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link href="/houses">Explore houses</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-white text-brand-700 hover:bg-white/90"
            >
              <Link href="/book">
                Book a Room
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
