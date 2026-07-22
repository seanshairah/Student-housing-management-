import { RoomType } from "@prisma/client";

/**
 * Monthly rent by room-sharing tier (USD). Students identify their room and its
 * sharing type during onboarding; the tier sets the room's monthly rent.
 *
 * NOTE: the single-room rate is not yet finalised — it defaults to null so the
 * owner sets it per room. The sharing tiers are the confirmed figures.
 */
export interface RentTier {
  key: string;
  label: string;
  roomType: RoomType;
  capacity: number;
  /** Monthly rent in USD, or null when the owner must confirm it. */
  monthlyRent: number | null;
}

export const RENT_TIERS: RentTier[] = [
  {
    key: "TWO_SHARING",
    label: "2 sharing — $120/mo",
    roomType: RoomType.SHARED_DOUBLE,
    capacity: 2,
    monthlyRent: 120,
  },
  {
    key: "THREE_SHARING",
    label: "3 sharing — $90/mo",
    roomType: RoomType.SHARED_TRIPLE,
    capacity: 3,
    monthlyRent: 90,
  },
  {
    key: "SINGLE",
    label: "Single room",
    roomType: RoomType.SINGLE,
    capacity: 1,
    monthlyRent: null, // owner confirms the single-room rate
  },
];

export function rentTierByKey(key: string): RentTier | undefined {
  return RENT_TIERS.find((t) => t.key === key);
}

/** Flat monthly transport service fee (USD). */
export const TRANSPORT_MONTHLY_FEE = 15;
