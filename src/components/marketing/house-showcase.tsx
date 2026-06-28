"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer, revealViewport } from "@/lib/animation-config";
import { HouseCard, type HouseCardData } from "@/components/marketing/house-card";

export type ShowcaseHouse = HouseCardData;

export function HouseShowcase({ houses }: { houses: ShowcaseHouse[] }) {
  return (
    <section className="container py-20 sm:py-28">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            The residences
          </p>
          <h2 className="mt-3 max-w-xl text-balance font-display text-4xl font-light tracking-tight sm:text-5xl">
            Two homes, one standard of care.
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Each residence is fully serviced and secure — built for studying well
          and living well.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2"
      >
        {houses.map((house) => (
          <HouseCard key={house.id} house={house} />
        ))}
      </motion.div>
    </section>
  );
}
