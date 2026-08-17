import { prisma } from "@/lib/prisma";
import {
  ChargeCategory,
  ChargeStatus,
  PaymentMethod,
  PaymentStatus,
  RoomStatus,
  RoomType,
  StudentStatus,
} from "@prisma/client";
import { allocatePayment } from "@/core/billing/ledger";
import { createReceipt } from "@/services/receipts";
import { createStudentAccount } from "@/services/students";
import { MUFUDZI_AUGUST } from "@/data/mufudzi-august";

/**
 * Rebuild Mufudzi House from the owner's August book: 40 rooms, two sharing,
 * $120/month, all occupied — and each student's semester ledger.
 *
 * The money model, validated against the sheet's own totals: the semester is
 * Aug–Nov at $120/month ($480), and everything a student has handed over —
 * including the $30 August booking amount — counts toward it. Per the owner,
 * HOW each dollar arrived is deliberately not recorded here; the ledger is
 * built so the dashboards answer the only question that matters: paid in
 * full, paid for the month, or not paid. That answer falls out of the same
 * charge arithmetic every other screen uses:
 *
 *   four monthly RENT charges + one settled payment for the credited total
 *   → balance $0 = paid in full · $360 = first month paid · $450 = not paid.
 *
 * RESUMABLE BY DESIGN. Serverless gives this action a bounded slice of time,
 * and 80 students of ledger rebuilding may not fit in one slice. Each student
 * is imported in their own transaction behind an is-it-done-already check, so
 * clicking again continues where the last run stopped instead of starting
 * over — and a finished import is a no-op.
 */

/** Deterministic marker for rows this import owns; re-runs replace, never duplicate. */
const REF_PREFIX = "AUG26";
const MONTHS: Array<[string, string, string]> = [
  ["August 2026", "2026-08-01", "2026-08-31"],
  ["September 2026", "2026-09-01", "2026-09-30"],
  ["October 2026", "2026-10-01", "2026-10-31"],
  ["November 2026", "2026-11-01", "2026-11-30"],
];
const MONTHLY = 120;

export interface AugustImportSummary {
  rooms: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  receipts: number;
  paidInFull: number;
  paidOneMonth: number;
  partiallyPaid: number;
  notPaid: number;
  done: boolean;
}

function placeholderEmail(fullName: string): string {
  const slug = fullName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z ]/g, "")
    .trim()
    .replace(/\s+/g, ".");
  return `${slug}@unknown.invalid`;
}

export async function runMufudziAugustImport(): Promise<AugustImportSummary> {
  const house = await prisma.house.findUnique({ where: { slug: "mufudzi" } });
  if (!house) throw new Error("Mufudzi house not found — seed the houses first.");

  // ── Phase A: the building itself ─────────────────────────────
  // Everyone out of their (possibly about-to-be-deleted) rooms first, then
  // normalise to exactly rooms 1..40. Assignments come back in phase B.
  const wanted = Array.from({ length: 40 }, (_, i) => String(i + 1));
  await prisma.$transaction(async (tx) => {
    await tx.studentProfile.updateMany({
      where: { room: { houseId: house.id } },
      data: { roomId: null },
    });
    await tx.application.updateMany({
      where: { room: { houseId: house.id } },
      data: { roomId: null },
    });
    await tx.room.deleteMany({
      where: { houseId: house.id, number: { notIn: wanted } },
    });
    for (const number of wanted) {
      const existing = await tx.room.findFirst({
        where: { houseId: house.id, number },
      });
      const data = {
        type: RoomType.SHARED_DOUBLE,
        capacity: 2,
        price: MONTHLY,
        status: RoomStatus.OCCUPIED,
      };
      if (existing) {
        await tx.room.update({ where: { id: existing.id }, data });
      } else {
        await tx.room.create({
          data: { houseId: house.id, number, ...data, amenities: [] },
        });
      }
    }
  }, { timeout: 30000 });
  const rooms = await prisma.room.findMany({
    where: { houseId: house.id },
    select: { id: true, number: true },
  });
  const roomByNumber = new Map(rooms.map((r) => [r.number, r.id]));

  // ── Phase B: one student at a time, resumable ────────────────
  const summary: AugustImportSummary = {
    rooms: rooms.length,
    processed: 0, created: 0, updated: 0, skipped: 0, receipts: 0,
    paidInFull: 0, paidOneMonth: 0, partiallyPaid: 0, notPaid: 0,
    done: false,
  };
  const roomSlot = new Map<number, number>();

  for (const row of MUFUDZI_AUGUST) {
    const slot = (roomSlot.get(row.room) ?? 0) + 1;
    roomSlot.set(row.room, slot);
    const reference = `${REF_PREFIX}-R${String(row.room).padStart(2, "0")}-${slot === 1 ? "A" : "B"}`;
    const email = (row.email ?? placeholderEmail(row.fullName)).toLowerCase();
    const roomId = roomByNumber.get(String(row.room));
    if (!roomId) throw new Error(`Room ${row.room} missing after phase A`);

    if (row.credited >= 480) summary.paidInFull++;
    else if (row.credited === 120) summary.paidOneMonth++;
    else if (row.credited <= 30) summary.notPaid++;
    else summary.partiallyPaid++;

    // Find or create the account.
    const user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true },
    });
    let profileId = user?.studentProfile?.id;
    if (!profileId) {
      const created = await prisma.$transaction(async (tx) => {
        return createStudentAccount(
          {
            fullName: row.fullName,
            email,
            phone: row.phone,
            houseId: house.id,
            roomId,
            status: StudentStatus.ACTIVE,
          },
          tx,
        );
      });
      profileId = created.studentProfileId;
      summary.created++;
    } else {
      summary.updated++;
    }

    // Already imported? (4 of our charges + our payment when money was paid.)
    const [ourCharges, ourPayment] = await Promise.all([
      prisma.charge.count({
        where: { studentProfileId: profileId, description: { startsWith: "Rent — " } },
      }),
      prisma.payment.findUnique({ where: { reference } }),
    ]);
    if (ourCharges === 4 && (row.credited <= 0 || ourPayment)) {
      await prisma.studentProfile.update({
        where: { id: profileId },
        data: {
          status: StudentStatus.ACTIVE,
          houseId: house.id,
          roomId,
          moveInDate: new Date("2026-08-01"),
        },
      });
      summary.skipped++;
      summary.processed++;
      continue;
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.studentProfile.update({
          where: { id: profileId },
          data: {
            fullName: row.fullName,
            status: StudentStatus.ACTIVE,
            houseId: house.id,
            roomId,
            moveInDate: new Date("2026-08-01"),
          },
        });

        // Out with this student's previous book. Gateway (PAYNOW) rows are
        // audit history of online attempts and stay; everything else is the
        // superseded import this one replaces.
        const oldPayments = await tx.payment.findMany({
          where: { studentProfileId: profileId, method: { not: PaymentMethod.PAYNOW } },
          select: { id: true },
        });
        const oldIds = oldPayments.map((p) => p.id);
        await tx.paymentAllocation.deleteMany({
          where: { OR: [{ paymentId: { in: oldIds } }, { charge: { studentProfileId: profileId } }] },
        });
        await tx.receipt.deleteMany({ where: { paymentId: { in: oldIds } } });
        await tx.charge.deleteMany({ where: { studentProfileId: profileId } });
        await tx.payment.deleteMany({ where: { id: { in: oldIds } } });

        // The semester, month by month, so the dashboards can say WHICH month
        // is covered rather than just how much is left.
        await tx.charge.createMany({
          data: MONTHS.map(([label, start, end]) => ({
            studentProfileId: profileId!,
            category: ChargeCategory.RENT,
            description: `Rent — ${label}`,
            amount: MONTHLY,
            status: ChargeStatus.OUTSTANDING,
            periodStart: new Date(start),
            periodEnd: new Date(end),
            dueDate: new Date(start),
          })),
        });

        if (row.credited > 0) {
          const payment = await tx.payment.create({
            data: {
              reference,
              studentProfileId: profileId!,
              amount: row.credited,
              category: ChargeCategory.RENT,
              method: PaymentMethod.CASH,
              status: PaymentStatus.PAID,
              paidAt: new Date(),
            },
          });
          await allocatePayment(payment.id, tx);
          await createReceipt(payment.id, row.credited, tx);
          summary.receipts++;
        }
      },
      { timeout: 15000 },
    );
    summary.processed++;
  }

  // ── Phase C: occupancy from the ground truth ─────────────────
  for (const room of rooms) {
    const occupied = await prisma.studentProfile.count({
      where: { roomId: room.id },
    });
    await prisma.room.update({
      where: { id: room.id },
      data: {
        occupied,
        status:
          occupied >= 2
            ? RoomStatus.OCCUPIED
            : occupied > 0
              ? RoomStatus.RESERVED
              : RoomStatus.AVAILABLE,
      },
    });
  }

  summary.done = summary.processed === MUFUDZI_AUGUST.length;
  return summary;
}
