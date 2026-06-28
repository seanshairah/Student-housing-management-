"use client";

import { motion } from "framer-motion";
import {
  Wifi,
  Zap,
  Droplets,
  ShieldCheck,
  Sparkles,
  Wrench,
  BookOpen,
  Users,
} from "lucide-react";
import { fadeUp, staggerContainer, revealViewport } from "@/lib/animation-config";

const ITEMS = [
  {
    icon: Wifi,
    title: "High-speed Wi-Fi",
    description: "Reliable fibre throughout, built for streaming and study.",
  },
  {
    icon: Zap,
    title: "Backup power",
    description: "Solar and generator backup keep you online and lit.",
  },
  {
    icon: Droplets,
    title: "Water 24/7",
    description: "Borehole and municipal supply with hot water around the clock.",
  },
  {
    icon: ShieldCheck,
    title: "24/7 security",
    description: "Controlled access, CCTV in common areas, and on-site care.",
  },
  {
    icon: Sparkles,
    title: "Cleaning service",
    description: "Regular cleaning of shared spaces so you can focus on study.",
  },
  {
    icon: Wrench,
    title: "Maintenance on request",
    description: "Report a fault and our team responds quickly.",
  },
  {
    icon: BookOpen,
    title: "Study lounges",
    description: "Quiet reading rooms and communal areas to work together.",
  },
  {
    icon: Users,
    title: "Friendly community",
    description: "A welcoming residence where it's easy to feel at home.",
  },
];

export function Amenities() {
  return (
    <section className="container py-20 sm:py-28">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="max-w-2xl"
      >
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Amenities &amp; services
        </p>
        <h2 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">
          Everything a student needs.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Comfort, reliability, and care included with every room.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
      >
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="bg-card p-6 transition-colors hover:bg-brand-50/60"
            >
              <Icon className="size-5 text-foreground" strokeWidth={1.5} />
              <h3 className="mt-4 font-display text-base font-medium">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
