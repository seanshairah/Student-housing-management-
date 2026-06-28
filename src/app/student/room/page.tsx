import Link from "next/link";
import {
  DoorOpen,
  MapPin,
  ShieldCheck,
  Sparkles,
  ScrollText,
  Wrench,
} from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { formatCurrency } from "@/lib/utils";
import { ROOM_STATUS_META } from "@/constants";

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: "Single",
  SHARED_DOUBLE: "Shared (Double)",
  SHARED_TRIPLE: "Shared (Triple)",
  ENSUITE: "En-suite",
  STUDIO: "Studio",
};

export default async function StudentRoomPage() {
  const session = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    include: { house: true, room: true },
  });

  if (!profile?.house || !profile?.room) {
    return (
      <div className="space-y-6">
        <PageHeader title="My room" description="Your assigned accommodation" />
        <EmptyState
          icon={<DoorOpen className="size-5" />}
          title="No room assigned yet"
          description="Once your application is approved and your first payment is made, your room and house details will appear here."
          action={
            <Button asChild variant="brand">
              <Link href="/book">Apply for a room</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { house, room } = profile;

  return (
    <div className="space-y-6">
      <PageHeader
        title={house.name}
        description={house.tagline ?? "Your home away from home"}
      >
        <StatusBadge meta={ROOM_STATUS_META[room.status]} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Room summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Room {room.number}</CardTitle>
            <CardDescription>
              {room.name ?? ROOM_TYPE_LABELS[room.type] ?? room.type}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Type" value={ROOM_TYPE_LABELS[room.type] ?? room.type} />
            <Row label="Floor" value={room.floor ?? "—"} />
            <Row label="Capacity" value={`${room.capacity}`} />
            <Row label="Monthly rent" value={formatCurrency(Number(room.price))} />
            <div className="flex items-center gap-1.5 pt-1 text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span>{house.location}</span>
            </div>
            {room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {room.amenities.map((a) => (
                  <Badge key={a} color="brand">
                    {a}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* House details */}
        <div className="space-y-6 lg:col-span-2">
          <ListCard
            title="Amenities"
            description="What's available in your house"
            icon={<Sparkles className="size-4 text-brand-600" />}
            items={house.amenities}
            empty="No amenities listed."
          />
          <ListCard
            title="House rules"
            description="Please keep these in mind"
            icon={<ScrollText className="size-4 text-brand-600" />}
            items={house.rules}
            empty="No house rules listed."
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ListCard
          title="Services"
          description="Included with your stay"
          icon={<Wrench className="size-4 text-brand-600" />}
          items={house.services}
          empty="No services listed."
        />
        <ListCard
          title="Safety information"
          description="Stay safe in your house"
          icon={<ShieldCheck className="size-4 text-brand-600" />}
          items={house.safetyInfo}
          empty="No safety information listed."
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}

function ListCard({
  title,
  description,
  icon,
  items,
  empty,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: string[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="space-y-2 text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  );
}
