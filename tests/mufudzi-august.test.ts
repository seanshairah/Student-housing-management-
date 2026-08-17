/**
 * PLATFORM-LOCAL test — deliberately not part of the byte-identical shared
 * suite. Mufudzi House and its August book exist only on this platform; the
 * sibling platform will get its own roster import and its own version of
 * this file when its sheet arrives.
 */
import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("the August roster import produces the book the owner wrote", () => {
  // Runs the real import — rooms, accounts, charges, payment, allocation,
  // receipts — against the test database and checks the only numbers that
  // matter: who is paid in full, who has paid the first month, who has not
  // paid. The distribution is fixed by the spreadsheet itself.
  it("imports 40 rooms and 80 students with the sheet's exact balance distribution", async () => {
    const { runMufudziAugustImport } = await import("@/services/students/august-import");
    const { MUFUDZI_AUGUST } = await import("@/data/mufudzi-august");

    await prisma.house.upsert({
      where: { slug: "mufudzi" },
      update: {},
      create: {
        name: "Mufudzi House (import test)",
        slug: "mufudzi",
        description: "Fixture",
        location: "Test",
        amenities: [], services: [], rules: [], safetyInfo: [],
      },
    });

    const s = await runMufudziAugustImport();
    expect(s.done).toBe(true);
    expect(s.rooms).toBe(40);
    expect(s.processed).toBe(80);
    expect(s.paidInFull).toBe(3);      // 480, 510, 510
    expect(s.paidOneMonth).toBe(66);   // 30 + 90
    expect(s.partiallyPaid).toBe(4);   // 240 x3, 450 x1
    expect(s.notPaid).toBe(7);         // deposit only
    // Everyone paid something, so every student ends up with a receipt —
    // issued this run, or already there from a previous (resumed) run.
    expect(s.receipts + s.skipped).toBe(80);
    const receiptCount = await prisma.receipt.count({
      where: { payment: { reference: { startsWith: "AUG26-" } } },
    });
    expect(receiptCount).toBe(80);

    // Rooms are full and say so.
    const rooms = await prisma.room.findMany({ where: { house: { slug: "mufudzi" } } });
    expect(rooms).toHaveLength(40);
    expect(rooms.every((r) => r.occupied === 2 && r.status === "OCCUPIED")).toBe(true);

    // Spot-check the three headline cases straight from the ledger.
    const balanceOf = async (fullName: string) => {
      const p = await prisma.studentProfile.findFirst({
        where: { fullName },
        include: {
          charges: {
            where: { status: "OUTSTANDING" },
            include: { allocations: true },
          },
        },
      });
      if (!p) throw new Error(`missing ${fullName}`);
      return p.charges.reduce((sum, c) => {
        const alloc = c.allocations.reduce((a, x) => a + Number(x.amount), 0);
        return sum + Math.max(0, Number(c.amount) - alloc);
      }, 0);
    };
    expect(await balanceOf("Belinda Makotose")).toBe(0);    // 30 + 450: full semester
    expect(await balanceOf("Sharon Moyo")).toBe(360);       // 30 + 90: first month
    expect(await balanceOf("Praise Chanama")).toBe(450);    // deposit only: not paid

    // Running it again changes nothing — it recognises its own work.
    const again = await runMufudziAugustImport();
    expect(again.skipped).toBe(80);
    expect(await balanceOf("Sharon Moyo")).toBe(360);

    const payments = await prisma.payment.count({
      where: { reference: { startsWith: "AUG26-" } },
    });
    expect(payments).toBe(MUFUDZI_AUGUST.length);
  }, 120_000);
});
