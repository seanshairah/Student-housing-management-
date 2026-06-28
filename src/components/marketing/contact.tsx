import Link from "next/link";
import { Mail, Phone, MapPin, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DETAILS = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@studenthousing.example",
    hint: "We reply within a day",
  },
  {
    icon: Phone,
    label: "Phone / WhatsApp",
    value: "+000 000 0000 (placeholder)",
    hint: "Mon–Sat, 8am–6pm",
  },
  {
    icon: MapPin,
    label: "Locations",
    value: "Mount Pleasant & Avondale",
    hint: "Placeholder addresses",
  },
  {
    icon: Clock,
    label: "Office hours",
    value: "Mon–Fri 8:00–17:00",
    hint: "Weekend viewings on request",
  },
];

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 bg-brand-50/60 py-20">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Contact
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Ready when you are
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Have a question or want to arrange a viewing? Reach out, or skip
              ahead and book your room online.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="brand" size="lg">
                <Link href="/book">
                  Book a Room
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/houses">Browse houses</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {DETAILS.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.label}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {d.label}
                  </p>
                  <p className="mt-0.5 font-semibold">{d.value}</p>
                  <p className="text-xs text-muted-foreground">{d.hint}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
