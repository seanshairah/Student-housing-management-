"use client";

import * as React from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  animate,
} from "framer-motion";
import { fadeUp, staggerContainer, revealViewport } from "@/lib/animation-config";

export interface SiteStats {
  houses: number;
  totalRooms: number;
  occupancyPct: number;
  students: number;
}

export function StatsCounters({ stats }: { stats: SiteStats }) {
  const items = [
    { value: stats.houses, label: "Residences", suffix: "" },
    { value: stats.totalRooms, label: "Rooms", suffix: "" },
    { value: stats.occupancyPct, label: "Occupancy", suffix: "%" },
    { value: stats.students, label: "Students housed", suffix: "" },
  ];

  return (
    <section className="border-y border-brand-800 bg-brand-900 text-brand-50">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="container grid grid-cols-2 gap-y-10 py-16 lg:grid-cols-4"
      >
        {items.map((item) => (
          <motion.div
            key={item.label}
            variants={fadeUp}
            className="border-l border-white/15 pl-5"
          >
            <Counter value={item.value} suffix={item.suffix} />
            <p className="mt-2 text-xs uppercase tracking-wider text-brand-300">
              {item.label}
            </p>
          </motion.div>
        ))}
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
      className="font-display text-4xl font-light tracking-tight sm:text-5xl"
    >
      {display}
      {suffix}
    </span>
  );
}
