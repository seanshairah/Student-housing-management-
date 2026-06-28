"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fadeUp, staggerContainer, revealViewport } from "@/lib/animation-config";
import { formatCurrency } from "@/lib/utils";

export interface ShowcaseHouse {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  location: string;
  imageUrl: string;
  availableRooms: number;
  priceFrom: number;
}

export function HouseShowcase({ houses }: { houses: ShowcaseHouse[] }) {
  return (
    <section className="container py-20">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Our Houses
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Two homes, one standard of care
        </h2>
        <p className="mt-3 text-muted-foreground">
          Each residence is fully serviced, secure, and built for studying well
          and living well.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="mt-12 grid gap-8 md:grid-cols-2"
      >
        {houses.map((house) => (
          <motion.article
            key={house.id}
            variants={fadeUp}
            className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image
                src={house.imageUrl}
                alt={house.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute right-3 top-3">
                <Badge
                  color={house.availableRooms > 0 ? "emerald" : "slate"}
                  className="shadow-sm backdrop-blur"
                >
                  {house.availableRooms > 0 ? (
                    <>
                      <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                      {house.availableRooms} room
                      {house.availableRooms === 1 ? "" : "s"} available
                    </>
                  ) : (
                    "Fully booked"
                  )}
                </Badge>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-display text-xl font-semibold">{house.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {house.tagline}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-brand-600" />
                {house.location}
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-xs text-muted-foreground">From</span>
                <span className="font-display text-2xl font-bold text-brand-700">
                  {formatCurrency(house.priceFrom)}
                </span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/houses/${house.slug}`}>View house</Link>
                </Button>
                <Button asChild variant="brand" className="flex-1">
                  <Link href={`/book?house=${house.slug}`}>
                    Book
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
