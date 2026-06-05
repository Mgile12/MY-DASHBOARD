"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { auth } from "@/auth";
import { aestToday, isAestSunday } from "@/lib/date";

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
  const session = await auth();
  const email = session?.user?.email;
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

  revalidatePath("/journal");
  return { ok: true };
}
