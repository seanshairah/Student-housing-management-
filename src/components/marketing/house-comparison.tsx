"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, revealViewport } from "@/lib/animation-config";
import { cn, formatCurrency } from "@/lib/utils";

export interface ComparisonHouse {
  id: string;
  name: string;
  slug: string;
  amenities: string[];
  priceFrom: number;
  availableRooms: number;
}

export function HouseComparison({ houses }: { houses: ComparisonHouse[] }) {
  const [active, setActive] = React.useState<string | null>(null);

  if (houses.length < 2) return null;

  // Union of amenities across both houses for an honest comparison.
  const allAmenities = Array.from(
    new Set(houses.flatMap((h) => h.amenities)),
  ).sort();

  return (
    <section className="bg-brand-50/60 py-20">
      <div className="container">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Compare
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Find your perfect fit
          </h2>
          <p className="mt-3 text-muted-foreground">
            Hover a house to highlight it, then book the one that suits you.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
        >
          {/* Header row */}
          <div className="grid grid-cols-[1.2fr_repeat(2,1fr)] border-b border-border bg-muted/40">
            <div className="p-4 text-sm font-semibold text-muted-foreground sm:p-5">
              Features
            </div>
            {houses.map((h) => (
              <button
                key={h.id}
                type="button"
                onMouseEnter={() => setActive(h.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(h.id)}
                onBlur={() => setActive(null)}
                className={cn(
                  "p-4 text-center transition-colors sm:p-5",
                  active === h.id && "bg-brand-100/70",
                )}
              >
                <span className="font-display text-base font-semibold sm:text-lg">
                  {h.name}
                </span>
              </button>
            ))}
          </div>

          {/* Price row */}
          <ComparisonRow label="Price from" active={active} houses={houses}>
            {houses.map((h) => (
              <span
                key={h.id}
                className="font-semibold text-brand-700"
              >
                {formatCurrency(h.priceFrom)}
              </span>
            ))}
          </ComparisonRow>

          {/* Available rooms row */}
          <ComparisonRow label="Rooms available" active={active} houses={houses}>
            {houses.map((h) => (
              <span key={h.id} className="font-medium">
                {h.availableRooms}
              </span>
            ))}
          </ComparisonRow>

          {/* Amenities */}
          {allAmenities.map((amenity) => (
            <ComparisonRow
              key={amenity}
              label={amenity}
              active={active}
              houses={houses}
            >
              {houses.map((h) =>
                h.amenities.includes(amenity) ? (
                  <Check
                    key={h.id}
                    className="mx-auto size-5 text-brand-600"
                    aria-label="Included"
                  />
                ) : (
                  <X
                    key={h.id}
                    className="mx-auto size-5 text-muted-foreground/40"
                    aria-label="Not included"
                  />
                ),
              )}
            </ComparisonRow>
          ))}

          {/* CTA row */}
          <div className="grid grid-cols-[1.2fr_repeat(2,1fr)] border-t border-border">
            <div className="p-4 sm:p-5" />
            {houses.map((h) => (
              <div
                key={h.id}
                className={cn(
                  "p-4 text-center transition-colors sm:p-5",
                  active === h.id && "bg-brand-100/70",
                )}
              >
                <Button asChild variant="brand" size="sm">
                  <Link href={`/book?house=${h.slug}`}>Book</Link>
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ComparisonRow({
  label,
  children,
  active,
  houses,
}: {
  label: string;
  children: React.ReactNode[];
  active: string | null;
  houses: ComparisonHouse[];
}) {
  return (
    <div className="grid grid-cols-[1.2fr_repeat(2,1fr)] border-b border-border/70 text-sm last:border-b-0">
      <div className="flex items-center p-4 font-medium text-foreground/80 sm:p-5">
        {label}
      </div>
      {React.Children.toArray(children).map((child, i) => (
        <div
          key={houses[i]?.id ?? i}
          className={cn(
            "flex items-center justify-center p-4 text-center transition-colors sm:p-5",
            active === houses[i]?.id && "bg-brand-100/70",
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
