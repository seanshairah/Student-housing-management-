"use client";

import * as React from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  animate,
} from "framer-motion";
import { Home, BedDouble, Percent, GraduationCap } from "lucide-react";
import { fadeUp, staggerContainer, revealViewport } from "@/lib/animation-config";

export interface SiteStats {
  houses: number;
  totalRooms: number;
  occupancyPct: number;
  students: number;
}

const ICONS = [Home, BedDouble, Percent, GraduationCap];

export function StatsCounters({ stats }: { stats: SiteStats }) {
  const items = [
    { value: stats.houses, label: "Houses", suffix: "" },
    { value: stats.totalRooms, label: "Rooms", suffix: "" },
    { value: stats.occupancyPct, label: "Occupancy", suffix: "%" },
    { value: stats.students, label: "Students housed", suffix: "" },
  ];

  return (
    <section className="border-y border-border bg-brand-900 py-14 text-white">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="container grid grid-cols-2 gap-8 lg:grid-cols-4"
      >
        {items.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <motion.div
              key={item.label}
              variants={fadeUp}
              className="flex flex-col items-center text-center"
            >
              <span className="mb-3 grid size-11 place-items-center rounded-xl bg-white/10 text-brand-200">
                <Icon className="size-5" />
              </span>
              <Counter value={item.value} suffix={item.suffix} />
              <p className="mt-1 text-sm text-brand-100/80">{item.label}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span
      ref={ref}
      className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
    >
      {display}
      {suffix}
    </span>
  );
}
