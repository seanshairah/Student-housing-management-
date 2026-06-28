import { prisma } from "@/lib/prisma";
import { RoomStatus } from "@prisma/client";
import { toNumber } from "@/lib/utils";
import { SiteShell } from "@/components/marketing/site-shell";
import { Hero } from "@/components/marketing/hero";
import { StatsCounters } from "@/components/marketing/stats-counters";
import {
  HouseShowcase,
  type ShowcaseHouse,
} from "@/components/marketing/house-showcase";
import {
  HouseComparison,
  type ComparisonHouse,
} from "@/components/marketing/house-comparison";
import { Amenities } from "@/components/marketing/amenities";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Faq } from "@/components/marketing/faq";
import { Contact } from "@/components/marketing/contact";

export const dynamic = "force-dynamic";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80";

export default async function HomePage() {
  const houses = await prisma.house.findMany({
    orderBy: { name: "asc" },
    include: { rooms: true },
  });

  const showcase: ShowcaseHouse[] = houses.map((h) => {
    const available = h.rooms.filter((r) => r.status === RoomStatus.AVAILABLE);
    const prices = h.rooms.map((r) => toNumber(r.price));
    return {
      id: h.id,
      name: h.name,
      slug: h.slug,
      tagline: h.tagline ?? "",
      location: h.location,
      imageUrl: h.imageUrl ?? FALLBACK_IMG,
      availableRooms: available.length,
      priceFrom: prices.length ? Math.min(...prices) : 0,
    };
  });

  const comparison: ComparisonHouse[] = houses.map((h) => {
    const prices = h.rooms.map((r) => toNumber(r.price));
    return {
      id: h.id,
      name: h.name,
      slug: h.slug,
      amenities: h.amenities,
      priceFrom: prices.length ? Math.min(...prices) : 0,
      availableRooms: h.rooms.filter((r) => r.status === RoomStatus.AVAILABLE)
        .length,
    };
  });

  // Aggregate stats
  const allRooms = houses.flatMap((h) => h.rooms);
  const totalCapacity = allRooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalOccupied = allRooms.reduce((sum, r) => sum + r.occupied, 0);
  const students = await prisma.studentProfile.count();
  const stats = {
    houses: houses.length,
    totalRooms: allRooms.length,
    occupancyPct: totalCapacity
      ? Math.round((totalOccupied / totalCapacity) * 100)
      : 0,
    students,
  };

  return (
    <SiteShell>
      <Hero />
      <StatsCounters stats={stats} />
      <HouseShowcase houses={showcase} />
      <HouseComparison houses={comparison} />
      <Amenities />
      <HowItWorks />
      <Faq />
      <Contact />
    </SiteShell>
  );
}
