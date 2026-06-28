"use client";

import { motion, useReducedMotion } from "framer-motion";
import { howItWorks } from "@/data/houses";
import { fadeUp, revealViewport } from "@/lib/animation-config";

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section id="how-it-works" className="container scroll-mt-20 py-20">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          How It Works
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          From browsing to moving in
        </h2>
        <p className="mt-3 text-muted-foreground">
          A simple, transparent process — five steps and you&apos;re home.
        </p>
      </motion.div>

      <div className="relative mx-auto mt-14 max-w-2xl">
        {/* Animated vertical line */}
        <div className="absolute bottom-0 left-[19px] top-2 w-px -translate-x-1/2 bg-border sm:left-6">
          <motion.div
            className="w-full origin-top gradient-brand"
            style={{ height: "100%" }}
            initial={{ scaleY: reduce ? 1 : 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </div>

        <ol className="space-y-8">
          {howItWorks.map((step, i) => (
            <motion.li
              key={step.title}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
                delay: i * 0.05,
              }}
              className="group relative flex gap-5 pl-0 sm:gap-6"
            >
              <div className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full gradient-brand font-display text-sm font-bold text-white shadow-md ring-4 ring-background transition-transform duration-300 group-hover:scale-110 sm:size-12">
                {i + 1}
              </div>
              <div className="flex-1 rounded-2xl border border-transparent bg-card p-4 transition-all duration-300 group-hover:border-border group-hover:shadow-sm sm:p-5">
                <h3 className="font-display text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
