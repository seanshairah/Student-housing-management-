import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { RoomStatus } from "@prisma/client";
import { toNumber, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Check, ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/marketing/site-shell";

export const revalidate = 60; // ISR: cache for 60s for fast loads

export const metadata: Metadata = {
  title: "Houses",
  description:
    "Browse Mufudzi House and Siphiwe House — amenities, services, room types, and live room availability.",
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80";

export default async function HousesPage() {
  const houses = await prisma.house.findMany({
    orderBy: { name: "asc" },
    include: { rooms: { orderBy: { price: "asc" } } },
  });

  return (
    <SiteShell>
      <section className="container py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Our Houses
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Find the right home for you
          </h1>
          <p className="mt-3 text-muted-foreground">
            Both houses are fully serviced and secure. Compare amenities and
            live availability below.
          </p>
        </div>

        <div className="mt-12 space-y-10">
          {houses.map((house, idx) => {
            const available = house.rooms.filter(
              (r) => r.status === RoomStatus.AVAILABLE,
            );
            const prices = house.rooms.map((r) => toNumber(r.price));
            const priceFrom = prices.length ? Math.min(...prices) : 0;

            return (
              <article
                key={house.id}
                className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
              >
                <div className="grid lg:grid-cols-2">
                  <div
                    className={`relative aspect-[16/10] w-full lg:aspect-auto lg:min-h-[22rem] ${
                      idx % 2 === 1 ? "lg:order-2" : ""
                    }`}
                  >
                    <Image
                      src={house.imageUrl ?? FALLBACK_IMG}
                      alt={house.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className="absolute left-4 top-4">
                      <Badge
                        color={available.length > 0 ? "emerald" : "slate"}
                        className="shadow-sm backdrop-blur"
                      >
                        {available.length > 0
                          ? `${available.length} room${
                              available.length === 1 ? "" : "s"
                            } available`
                          : "Fully booked"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <h2 className="font-display text-2xl font-bold tracking-tight">
                      {house.name}
                    </h2>
                    {house.tagline && (
                      <p className="mt-1.5 text-muted-foreground">
                        {house.tagline}
                      </p>
                    )}
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-4 shrink-0 text-brand-600" />
                      {house.location}
                    </p>

                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {house.description}
                    </p>

                    {house.amenities.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Top amenities
                        </p>
                        <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {house.amenities.slice(0, 6).map((a) => (
                            <li
                              key={a}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="size-4 shrink-0 text-brand-600" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {available.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Available rooms
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {available.slice(0, 5).map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium"
                            >
                              {r.number} · {formatCurrency(toNumber(r.price))}
                            </span>
                          ))}
                          {available.length > 5 && (
                            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs text-muted-foreground">
                              +{available.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-muted-foreground">
                          From
                        </span>
                        <span className="font-display text-2xl font-bold text-brand-700">
                          {formatCurrency(priceFrom)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / month
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline">
                          <Link href={`/houses/${house.slug}`}>
                            View details
                          </Link>
                        </Button>
                        <Button asChild variant="brand">
                          <Link href={`/book?house=${house.slug}`}>
                            Book
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </SiteShell>
  );
}
