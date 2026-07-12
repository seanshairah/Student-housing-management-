import { prisma } from "@/lib/prisma";
import { type Prisma } from "@prisma/client";

export async function getSettings() {
  return prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

/**
 * Atomically increment a document counter and return the formatted number.
 *
 * IMPORTANT: pass the active transaction client (`db`) when calling this from
 * inside a `prisma.$transaction`. The pool runs at connection_limit=1, so using
 * the global client here while a transaction holds the only connection
 * deadlocks (times out fetching a second connection).
 */
export async function nextNumber(
  kind: "invoice" | "receipt" | "statement",
  db: Prisma.TransactionClient = prisma,
): Promise<string> {
  const field =
    kind === "invoice"
      ? "invoiceCounter"
      : kind === "receipt"
        ? "receiptCounter"
        : "statementCounter";
  const prefixField =
    kind === "invoice"
      ? "invoicePrefix"
      : kind === "receipt"
        ? "receiptPrefix"
        : "statementPrefix";

  const settings = await db.settings.upsert({
    where: { id: "singleton" },
    update: { [field]: { increment: 1 } },
    create: { id: "singleton", [field]: 1001 },
    select: { [field]: true, [prefixField]: true },
  });

  const counter = (settings as Record<string, number | string>)[field] as number;
  const prefix = (settings as Record<string, number | string>)[
    prefixField
  ] as string;
  return `${prefix}-${String(counter).padStart(5, "0")}`;
}
