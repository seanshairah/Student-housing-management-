"use client";

import { motion, useReducedMotion } from "framer-motion";
import { howItWorks } from "@/data/houses";
import { fadeUp, revealViewport } from "@/lib/animation-config";

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section id="how-it-works" className="container scroll-mt-24 py-20 sm:py-28">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="max-w-2xl"
      >
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          How it works
        </p>
        <h2 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">
          From browsing to moving in.
        </h2>
        <p className="mt-4 text-muted-foreground">
          A simple, transparent process — five steps and you&apos;re home.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
        {howItWorks.map((step, i) => (
          <motion.div
            key={step.title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: i * 0.06,
            }}
            className="bg-card p-6 transition-colors hover:bg-brand-50/60"
          >
            <span className="font-display text-3xl font-light text-brand-300">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 font-display text-lg font-medium">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
