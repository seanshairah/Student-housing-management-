"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin, ShieldCheck, Wifi, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, staggerContainer } from "@/lib/animation-config";

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      {/* Soft animated gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className={`absolute -left-24 -top-24 size-[26rem] rounded-full bg-brand-300/40 blur-3xl ${
            reduce ? "" : "animate-blob-move"
          }`}
        />
        <div
          className={`absolute -right-20 top-10 size-[22rem] rounded-full bg-brand-400/30 blur-3xl ${
            reduce ? "" : "animate-blob-move"
          }`}
          style={{ animationDelay: "-6s" }}
        />
        <div
          className={`absolute bottom-0 left-1/3 size-[20rem] rounded-full bg-sand-200/40 blur-3xl ${
            reduce ? "" : "animate-blob-move"
          }`}
          style={{ animationDelay: "-12s" }}
        />
      </div>

      <div className="container grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:gap-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-sm"
          >
            <Star className="size-3.5 fill-brand-500 text-brand-500" />
            Two welcoming houses · Apply online in minutes
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-5 text-balance font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Student living that{" "}
            <span className="gradient-text">feels like home</span>.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Bright, secure rooms at Mufudzi &amp; Siphiwe House — fast Wi-Fi,
            backup power, on-site care, and a friendly community. Find your room
            and book it today.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild variant="brand" size="lg">
              <Link href="/book">
                Book a Room
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/houses">Explore the houses</Link>
            </Button>
          </motion.div>

          <motion.ul
            variants={fadeUp}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            <li className="flex items-center gap-2">
              <Wifi className="size-4 text-brand-600" /> High-speed Wi-Fi
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand-600" /> 24/7 security
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-brand-600" /> Close to campus
            </li>
          </motion.ul>
        </motion.div>

        {/* Floating house preview card */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className={reduce ? "" : "animate-float"}>
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-brand-900/10">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
                  alt="Mufudzi House"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  className="object-cover"
                />
                <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur">
                  <span className="size-2 animate-pulse rounded-full bg-brand-500" />
                  Rooms available
                </div>
              </div>
              <div className="space-y-1 p-5">
                <p className="font-display text-lg font-semibold">
                  Mufudzi House
                </p>
                <p className="text-sm text-muted-foreground">
                  Calm, connected living a short walk from campus.
                </p>
                <p className="pt-2 text-sm font-semibold text-brand-700">
                  From $110 / month
                </p>
              </div>
            </div>
          </div>

          {/* Decorative floating stat chip */}
          <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-border bg-white px-4 py-3 shadow-lg sm:block">
            <p className="text-xs text-muted-foreground">Reviewed within</p>
            <p className="font-display text-lg font-bold text-brand-700">
              1–2 days
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
