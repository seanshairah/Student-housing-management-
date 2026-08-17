import { MUFUDZI_AUGUST } from "@/data/mufudzi-august";
import {
  runRosterImport,
  type RosterImportSummary,
} from "@/services/students/roster-import";

/**
 * The curated August book for Mufudzi House — the checked-in roster whose
 * name matching against existing accounts was verified by hand (ten spelling
 * variants confirmed by email/room evidence). Ad-hoc sheets go through the
 * caretaker's Excel upload instead, which uses the same engine.
 *
 * The AUG26 reference prefix is this import's identity: it is what makes
 * re-runs recognise their own work, so it must never change.
 */
export type AugustImportSummary = RosterImportSummary;

export async function runMufudziAugustImport(): Promise<AugustImportSummary> {
  return runRosterImport(MUFUDZI_AUGUST, {
    houseSlug: "mufudzi",
    refPrefix: "AUG26",
  });
}
