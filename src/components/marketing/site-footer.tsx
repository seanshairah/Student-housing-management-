import Link from "next/link";
import { Home, Mail, Phone, MapPin } from "lucide-react";

const HOUSES = [
  { name: "Mufudzi House", slug: "mufudzi" },
  { name: "Siphiwe House", slug: "siphiwe" },
];

const QUICK_LINKS = [
  { label: "Houses", href: "/houses" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "FAQs", href: "/#faqs" },
  { label: "About", href: "/about" },
  { label: "Book a Room", href: "/book" },
  { label: "Sign in", href: "/auth/login" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border bg-brand-900 text-brand-50">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-white">
              <Home className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold text-white">
              Student Housing
            </span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-brand-100/80">
            Modern, secure student accommodation with a caring team. Apply
            online and manage everything from your portal.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-brand-100">
            Our Houses
          </h3>
          <ul className="space-y-2.5 text-sm">
            {HOUSES.map((h) => (
              <li key={h.slug}>
                <Link
                  href={`/houses/${h.slug}`}
                  className="text-brand-100/80 transition-colors hover:text-white"
                >
                  {h.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-brand-100">
            Quick Links
          </h3>
          <ul className="space-y-2.5 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-brand-100/80 transition-colors hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-brand-100">
            Get in Touch
          </h3>
          <ul className="space-y-3 text-sm text-brand-100/80">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-300" />
              <span>Mount Pleasant &amp; Avondale (placeholder)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-brand-300" />
              <span>+000 000 0000 (placeholder)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-brand-300" />
              <span>hello@studenthousing.example</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-brand-100/70 sm:flex-row">
          <p>© {year} Student Housing. All rights reserved.</p>
          <p>Mufudzi House &amp; Siphiwe House</p>
        </div>
      </div>
    </footer>
  );
}
