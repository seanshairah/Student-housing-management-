import Link from "next/link";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";

const HOUSES = [
  { name: "Mufudzi House", slug: "mufudzi" },
  { name: "Siphiwe House", slug: "siphiwe" },
];

const QUICK_LINKS = [
  { label: "Houses", href: "/houses" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "FAQs", href: "/#faqs" },
  { label: "About", href: "/about" },
  { label: "Book a room", href: "/book" },
  { label: "Sign in", href: "/auth/login" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="container py-16 sm:py-20">
        {/* Editorial CTA line */}
        <div className="flex flex-col gap-6 border-b border-border pb-14 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-xl text-balance font-display text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl">
            A quieter way to live, study and belong.
          </h2>
          <Link
            href="/book"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-700"
          >
            Book a room
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-10 pt-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="font-display text-xl font-semibold tracking-tight">
                Student
              </span>
              <span className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                Housing
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Calm, secure student residences with a caring team. Apply online
              and manage everything from your portal.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
              Our houses
            </h3>
            <ul className="space-y-2.5 text-sm">
              {HOUSES.map((h) => (
                <li key={h.slug}>
                  <Link
                    href={`/houses/${h.slug}`}
                    className="text-foreground/70 transition-colors hover:text-foreground"
                  >
                    {h.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-foreground/70 transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
              Get in touch
            </h3>
            <ul className="space-y-3 text-sm text-foreground/70">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-sand-400" />
                <span>Mount Pleasant &amp; Avondale (placeholder)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-sand-400" />
                <span>+000 000 0000 (placeholder)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-sand-400" />
                <span>hello@studenthousing.example</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} Student Housing. All rights reserved.</p>
          <p>Mufudzi House &amp; Siphiwe House</p>
        </div>
      </div>
    </footer>
  );
}
