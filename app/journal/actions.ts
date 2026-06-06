"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import { aestToday, isAestSunday } from "@/lib/date";
import {
  seedDefaultStandards,
  writeStandardCheckins,
} from "@/lib/standards";

// Number-like string → null | string. Same pattern as settings/actions.ts
// for consistency with how numerics flow through Drizzle.
const optionalNumericString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v))
  .refine(
    (v) => v === null || /^-?\d+(\.\d+)?$/.test(v),
    "must be a number",
  );

const optionalIntString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" || v === undefined ? 0 : parseInt(v, 10)))
  .refine((v) => Number.isFinite(v) && v >= 0, "must be a non-negative integer");

const taleEnum = z.enum([
  "",
  "victory",
  "adventure",
  "thankfulness",
  "empowerment",
]);

const journalSchema = z.object({
  moneyMoved: z.string(),
  callsMade: optionalIntString,
  followupsCompleted: optionalIntString,
  followupsNotes: z.string(),
  offersSent: optionalIntString,
  oneOffRevenueWon: optionalNumericString,
  recurringRevenueWon: optionalNumericString,
  dodged: z.string(),
  reactivePulls: z.string(),
  tomorrowMust: z.string(),
  trainingCompleted: z.string().optional(), // checkbox → "on" | undefined
  coldCallingCompleted: z.string().optional(),
  clientDeliveryCompleted: z.string().optional(),
  clientDeliveryNotes: z.string(),
  taleType: taleEnum,
});

export type JournalActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveJournal(
  formData: FormData,
): Promise<JournalActionResult> {
  const session = await getSession();
  const email = session?.email;
  if (!email) return { ok: false, error: "Not signed in" };

  if (isAestSunday()) {
    return {
      ok: false,
      error: "Sunday OODA replaces the journal — submissions blocked on Sunday.",
    };
  }

  const raw = {
    moneyMoved: formData.get("moneyMoved")?.toString() ?? "",
    callsMade: formData.get("callsMade")?.toString() ?? "",
    followupsCompleted: formData.get("followupsCompleted")?.toString() ?? "",
    followupsNotes: formData.get("followupsNotes")?.toString() ?? "",
    offersSent: formData.get("offersSent")?.toString() ?? "",
    oneOffRevenueWon: formData.get("oneOffRevenueWon")?.toString() ?? "",
    recurringRevenueWon: formData.get("recurringRevenueWon")?.toString() ?? "",
    dodged: formData.get("dodged")?.toString() ?? "",
    reactivePulls: formData.get("reactivePulls")?.toString() ?? "",
    tomorrowMust: formData.get("tomorrowMust")?.toString() ?? "",
    trainingCompleted: formData.get("trainingCompleted")?.toString(),
    coldCallingCompleted: formData.get("coldCallingCompleted")?.toString(),
    clientDeliveryCompleted: formData.get("clientDeliveryCompleted")?.toString(),
    clientDeliveryNotes: formData.get("clientDeliveryNotes")?.toString() ?? "",
    taleType: (formData.get("taleType")?.toString() ?? "") as
      | ""
      | "victory"
      | "adventure"
      | "thankfulness"
      | "empowerment",
  };

  const parsed = journalSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: `${first.path.join(".")}: ${first.message}` };
  }

  const v = parsed.data;
  const today = aestToday();

  const insertValues = {
    userId: email,
    date: today,
    moneyMoved: v.moneyMoved || null,
    callsMade: v.callsMade,
    followupsCompleted: v.followupsCompleted,
    followupsNotes: v.followupsNotes || null,
    offersSent: v.offersSent,
    oneOffRevenueWon: v.oneOffRevenueWon ?? "0",
    recurringRevenueWon: v.recurringRevenueWon ?? "0",
    dodged: v.dodged || null,
    reactivePulls: v.reactivePulls || null,
    tomorrowMust: v.tomorrowMust || null,
    clientDeliveryCompleted: v.clientDeliveryCompleted === "on",
    clientDeliveryNotes: v.clientDeliveryNotes || null,
    trainingCompleted: v.trainingCompleted === "on",
    coldCallingCompleted: v.coldCallingCompleted === "on",
    taleType: v.taleType === "" ? null : v.taleType,
  };

  try {
    await db
      .insert(journalEntries)
      .values(insertValues)
      .onConflictDoUpdate({
        target: [journalEntries.userId, journalEntries.date],
        set: {
          moneyMoved: insertValues.moneyMoved,
          callsMade: insertValues.callsMade,
          followupsCompleted: insertValues.followupsCompleted,
          followupsNotes: insertValues.followupsNotes,
          offersSent: insertValues.offersSent,
          oneOffRevenueWon: insertValues.oneOffRevenueWon,
          recurringRevenueWon: insertValues.recurringRevenueWon,
          dodged: insertValues.dodged,
          reactivePulls: insertValues.reactivePulls,
          tomorrowMust: insertValues.tomorrowMust,
          clientDeliveryCompleted: insertValues.clientDeliveryCompleted,
          clientDeliveryNotes: insertValues.clientDeliveryNotes,
          trainingCompleted: insertValues.trainingCompleted,
          coldCallingCompleted: insertValues.coldCallingCompleted,
          taleType: insertValues.taleType,
        },
      });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Database error",
    };
  }

  // Mirror the journal's standards check-ins into standard_checkins so
  // streak math (lib/standards.ts) and the brief can read structured
  // data. Idempotent — runs after every journal save, upserts by
  // (standard_id, date). Defensive seed in case the user hasn't hit
  // /settings yet.
  try {
    await seedDefaultStandards(email);
    await writeStandardCheckins(email, today, [
      {
        key: "training",
        hit: insertValues.trainingCompleted === true,
      },
      {
        // Submitting the journal IS the standard.
        key: "nightly_journal",
        hit: true,
      },
      {
        key: "cold_calling_30min",
        hit: insertValues.coldCallingCompleted === true,
      },
      {
        key: "calls_made",
        hit: insertValues.callsMade > 0,
        value: insertValues.callsMade.toString(),
      },
      {
        key: "client_delivery_block",
        hit: insertValues.clientDeliveryCompleted === true,
      },
    ]);
  } catch (e) {
    // Don't fail the journal save if checkin write fails — log and
    // continue. The journal_entries row is the source of truth; check-ins
    // are a derived index.
    console.error("writeStandardCheckins failed:", e);
  }

  revalidatePath("/journal");
  revalidatePath("/standards");
  return { ok: true };
}
