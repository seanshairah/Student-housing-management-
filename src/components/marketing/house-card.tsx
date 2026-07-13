"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin } from "lucide-react";
import { fadeUp } from "@/lib/animation-config";
import { formatCurrency } from "@/lib/utils";

export interface HouseCardData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  location: string;
  imageUrl: string;
  availableRooms: number;
  priceFrom: number;
}

/** Editorial property card used on the showcase grid. */
export function HouseCard({ house }: { house: HouseCardData }) {
  return (
    <motion.article variants={fadeUp} className="group flex flex-col">
      <Link
        href={`/houses/${house.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl"
      >
        <Image
          src={house.imageUrl}
          alt={house.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-medium backdrop-blur">
          <span
            className={
              house.availableRooms > 0
                ? "size-1.5 rounded-full bg-sand-400"
                : "size-1.5 rounded-full bg-brand-300"
            }
          />
          {house.availableRooms > 0
            ? `${house.availableRooms} room${house.availableRooms === 1 ? "" : "s"} available`
            : "Fully booked"}
        </span>
      </Link>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-medium tracking-tight">
            <Link href={`/houses/${house.slug}`} className="hover:underline">
              {house.name}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-sand-400" />
            {house.location}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            From
          </p>
          <p className="font-display text-lg font-semibold">
            {formatCurrency(house.priceFrom)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {house.tagline}
      </p>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <Link
          href={`/houses/${house.slug}`}
          className="inline-flex items-center gap-1 font-medium text-foreground hover:gap-2 transition-all"
        >
          View house
          <ArrowUpRight className="size-4" />
        </Link>
        <Link
          href={`/book?house=${house.slug}`}
          className="inline-flex items-center rounded-full border border-border px-3.5 py-1 font-medium text-foreground transition-colors hover:bg-accent"
        >
          Book
        </Link>
      </div>
    </motion.article>
  );
}
