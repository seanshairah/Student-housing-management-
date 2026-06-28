"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, staggerContainer } from "@/lib/animation-config";

const HERO_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";
const INSET_IMG =
  "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=800&q=80";

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div className="container pb-12 pt-10 sm:pb-20 sm:pt-16">
        {/* Top label row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between border-b border-border pb-6"
        >
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Student residences
          </span>
          <span className="hidden text-xs uppercase tracking-wider text-muted-foreground sm:inline">
            Mount Pleasant · Avondale
          </span>
        </motion.div>

        {/* Editorial headline */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="pt-10 sm:pt-16"
        >
          <motion.h1
            variants={fadeUp}
            className="max-w-5xl text-balance font-display text-5xl font-light leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.5rem]"
          >
            Modern student living,
            <br className="hidden sm:block" />{" "}
            <span className="italic text-brand-500">quietly</span> done well.
          </motion.h1>

          <motion.div
            variants={fadeUp}
            className="mt-8 grid gap-8 sm:mt-12 lg:grid-cols-[1.4fr_1fr] lg:items-end"
          >
            <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Mufudzi &amp; Siphiwe House — light-filled rooms, fast Wi-Fi,
              backup power and on-site care, a short walk from campus. Browse the
              houses and reserve your room online.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/book">
                  Book a room
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="/houses">Explore the houses</Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>

        {/* Large hero image with floating label cards */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative mt-12 sm:mt-16"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl sm:aspect-[16/9]">
            <Image
              src={HERO_IMG}
              alt="Interior of a modern student residence"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>

          {/* Floating availability card */}
          <div className="absolute left-4 top-4 rounded-2xl border border-border bg-background/90 px-4 py-3 backdrop-blur sm:left-6 sm:top-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Now leasing
            </p>
            <p className="mt-0.5 font-display text-base font-semibold">
              Rooms from $110 / mo
            </p>
          </div>

          {/* Floating inset image card */}
          <div className="absolute -bottom-6 right-4 hidden w-44 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-brand-900/10 sm:block lg:w-52">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={INSET_IMG}
                alt="Communal study lounge"
                fill
                sizes="220px"
                className="object-cover"
              />
            </div>
            <div className="px-3 py-2.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Study lounge
              </p>
              <p className="text-sm font-medium">Quiet, light, connected</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
