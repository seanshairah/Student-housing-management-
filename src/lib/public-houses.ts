import { prisma } from "@/lib/prisma";
import { seedHouses, type SeedHouse } from "@/data/houses";

/**
 * Resilient data layer for the PUBLIC marketing site (home, /houses,
 * /houses/[slug], /book).
 *
 * WHY THIS EXISTS — the real root cause of "sometimes it loads, sometimes it
 * spins forever":
 *
 * The public pages render from the database. On Neon's Launch ($5) plan the
 * compute AUTOSUSPENDS after a few minutes idle, and a suspended compute takes
 * a few seconds to wake. A plain `await prisma.house.findMany()` with no
 * timeout will therefore *hang* on the very requests that hit a cold database —
 * the page spins with a blank screen until the connection finally resolves (or
 * the platform kills it). When the DB happens to be warm, the same page loads
 * instantly. That is exactly the intermittent behaviour that was reported.
 *
 * The fix has two layers so a public page can NEVER hang and NEVER show an
 * empty site:
 *   1. Every DB read is raced against a short timeout. If the database is cold
 *      or slow it loses the race in a few seconds instead of blocking forever.
 *   2. On timeout/error we fall back to the canonical static house data (the
 *      same `seedHouses` the database was seeded from), so the marketing site
 *      still renders the real two houses and stays fully usable. Only live
 *      room-availability counts degrade gracefully; the page itself is fast.
 *
 * Live data is always preferred; the fallback only kicks in when the database
 * is unreachable in time.
 */

/** Max time we will wait for a public-page query before falling back. */
const QUERY_TIMEOUT_MS = 3500;

/** Plain, serialisable shape the public pages consume. */
export interface PublicRoom {
  id: string;
  number: string;
  name: string | null;
  type: string;
  floor: string | null;
  capacity: number;
  price: number;
  status: string;
}

export interface PublicHouse {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  location: string;
  imageUrl: string;
  images: string[];
  amenities: string[];
  services: string[];
  rules: string[];
  safetyInfo: string[];
  rooms: PublicRoom[];
}

/** Did the last call serve live data or the static fallback? */
export interface PublicHousesResult {
  houses: PublicHouse[];
  live: boolean;
}

function raceTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`public-query-timeout-${ms}ms`)), ms),
    ),
  ]);
}

/** Build the static fallback houses from the canonical seed data. */
function fallbackHouses(): PublicHouse[] {
  return seedHouses.map((h: SeedHouse) => ({
    id: h.slug,
    name: h.name,
    slug: h.slug,
    tagline: h.tagline,
    description: h.description,
    location: h.location,
    imageUrl: h.imageUrl,
    images: h.images,
    amenities: h.amenities,
    services: h.services,
    rules: h.rules,
    safetyInfo: h.safetyInfo,
    rooms: h.rooms.map((r) => ({
      id: `${h.slug}-${r.number}`,
      number: r.number,
      name: r.name ?? null,
      type: r.type,
      floor: r.floor ?? null,
      capacity: r.capacity,
      price: r.price,
      // Seed status when explicitly set, otherwise assume bookable so the
      // marketing site never reads as "fully booked" during a DB outage.
      status: r.status ?? "AVAILABLE",
    })),
  }));
}

/**
 * Fetch all houses (with rooms) for the public site. Never hangs: returns live
 * data when the DB answers in time, otherwise the static fallback.
 */
export async function getPublicHouses(): Promise<PublicHousesResult> {
  try {
    const rows = await raceTimeout(
      prisma.house.findMany({
        orderBy: { name: "asc" },
        include: { rooms: { orderBy: { price: "asc" } } },
      }),
      QUERY_TIMEOUT_MS,
    );
    if (!rows.length) return { houses: fallbackHouses(), live: false };
    const houses: PublicHouse[] = rows.map((h) => ({
      id: h.id,
      name: h.name,
      slug: h.slug,
      tagline: h.tagline ?? "",
      description: h.description,
      location: h.location,
      imageUrl: h.imageUrl ?? seedHouses[0].imageUrl,
      images: h.images,
      amenities: h.amenities,
      services: h.services,
      rules: h.rules,
      safetyInfo: h.safetyInfo,
      rooms: h.rooms.map((r) => ({
        id: r.id,
        number: r.number,
        name: r.name,
        type: r.type,
        floor: r.floor,
        capacity: r.capacity,
        price: Number(r.price),
        status: r.status,
      })),
    }));
    return { houses, live: true };
  } catch (err) {
    console.warn(
      "[public-houses] DB unavailable, serving static fallback:",
      err instanceof Error ? err.message : err,
    );
    return { houses: fallbackHouses(), live: false };
  }
}

/** Fetch a single house by slug for the public site. Never hangs. */
export async function getPublicHouse(
  slug: string,
): Promise<{ house: PublicHouse | null; live: boolean }> {
  const { houses, live } = await getPublicHouses();
  return { house: houses.find((h) => h.slug === slug) ?? null, live };
}

/**
 * Approximate resident count for the homepage stat. Best-effort: never hangs
 * and never throws — returns null on timeout so the caller can hide/estimate.
 */
export async function getStudentCount(): Promise<number | null> {
  try {
    return await raceTimeout(prisma.studentProfile.count(), QUERY_TIMEOUT_MS);
  } catch {
    return null;
  }
}
