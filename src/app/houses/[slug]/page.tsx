import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RoomStatus } from "@prisma/client";
import { toNumber, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Check,
  ShieldCheck,
  Wrench,
  ScrollText,
  ArrowRight,
  BedDouble,
} from "lucide-react";
import { SiteShell } from "@/components/marketing/site-shell";

export const dynamic = "force-dynamic";

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: "Single",
  SHARED_DOUBLE: "Shared (Double)",
  SHARED_TRIPLE: "Shared (Triple)",
  ENSUITE: "En-suite",
  STUDIO: "Studio",
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const house = await prisma.house.findUnique({ where: { slug } });
  if (!house) return { title: "House not found" };
  return {
    title: house.name,
    description: house.tagline ?? house.description.slice(0, 150),
  };
}

export default async function HouseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const house = await prisma.house.findUnique({
    where: { slug },
    include: { rooms: { orderBy: { price: "asc" } } },
  });

  if (!house) notFound();

  const availableRooms = house.rooms.filter(
    (r) => r.status === RoomStatus.AVAILABLE,
  );
  const prices = house.rooms.map((r) => toNumber(r.price));
  const priceFrom = prices.length ? Math.min(...prices) : 0;

  const roomTypes = Array.from(new Set(house.rooms.map((r) => r.type)));

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-64 w-full overflow-hidden sm:h-80 lg:h-96">
          <Image
            src={house.imageUrl ?? FALLBACK_IMG}
            alt={house.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-brand-900/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="container pb-6 text-white">
              <Badge
                color={availableRooms.length > 0 ? "emerald" : "slate"}
                className="shadow-sm"
              >
                {availableRooms.length > 0
                  ? `${availableRooms.length} room${
                      availableRooms.length === 1 ? "" : "s"
                    } available`
                  : "Fully booked"}
              </Badge>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {house.name}
              </h1>
              {house.tagline && (
                <p className="mt-1.5 max-w-2xl text-white/90">
                  {house.tagline}
                </p>
              )}
              <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="size-4 shrink-0" />
                {house.location}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          {/* Main content */}
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                About {house.name}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {house.description}
              </p>
            </div>

            {/* Amenities & services */}
            <div className="grid gap-6 sm:grid-cols-2">
              {house.amenities.length > 0 && (
                <InfoList
                  icon={<Check className="size-5 text-brand-600" />}
                  title="Amenities"
                  items={house.amenities}
                />
              )}
              {house.services.length > 0 && (
                <InfoList
                  icon={<Wrench className="size-5 text-brand-600" />}
                  title="Services"
                  items={house.services}
                />
              )}
              {house.safetyInfo.length > 0 && (
                <InfoList
                  icon={<ShieldCheck className="size-5 text-brand-600" />}
                  title="Safety"
                  items={house.safetyInfo}
                />
              )}
              {house.rules.length > 0 && (
                <InfoList
                  icon={<ScrollText className="size-5 text-brand-600" />}
                  title="House rules"
                  items={house.rules}
                />
              )}
            </div>

            {/* Room types */}
            {roomTypes.length > 0 && (
              <div>
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  Room types
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {roomTypes.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium"
                    >
                      <BedDouble className="size-4 text-brand-600" />
                      {ROOM_TYPE_LABELS[t] ?? t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Available rooms list */}
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                Available rooms
              </h3>
              {availableRooms.length === 0 ? (
                <Card className="mt-3">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    All rooms are currently taken. Check back soon or contact us
                    to join the waitlist.
                  </CardContent>
                </Card>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {availableRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div>
                        <p className="font-semibold">
                          Room {room.number}
                          {room.name ? ` · ${room.name}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ROOM_TYPE_LABELS[room.type] ?? room.type}
                          {room.floor ? ` · ${room.floor} floor` : ""}
                        </p>
                        <p className="mt-1 font-display text-lg font-bold text-brand-700">
                          {formatCurrency(toNumber(room.price))}
                          <span className="text-xs font-normal text-muted-foreground">
                            {" "}
                            / month
                          </span>
                        </p>
                      </div>
                      <Button asChild variant="brand" size="sm">
                        <Link
                          href={`/book?house=${house.slug}&room=${room.id}`}
                        >
                          Book this room
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky sidebar CTA */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden">
              <div className="gradient-brand p-6 text-white">
                <p className="text-sm text-white/80">From</p>
                <p className="font-display text-3xl font-bold">
                  {formatCurrency(priceFrom)}
                  <span className="text-sm font-normal text-white/80">
                    {" "}
                    / month
                  </span>
                </p>
              </div>
              <CardContent className="space-y-4 p-6">
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Total rooms</dt>
                    <dd className="font-semibold">{house.rooms.length}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Available now</dt>
                    <dd className="font-semibold text-brand-700">
                      {availableRooms.length}
                    </dd>
                  </div>
                </dl>
                <Button asChild variant="brand" className="w-full" size="lg">
                  <Link href={`/book?house=${house.slug}`}>
                    Book a Room
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/houses">Back to all houses</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

function InfoList({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="flex items-center gap-2 font-display text-base font-semibold">
        {icon}
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-brand-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
