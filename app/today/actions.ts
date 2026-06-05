"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { briefs, briefItems } from "@/db/schema";
import {
  generateBriefForToday,
  getTodayBrief,
  type BriefPayload,
  type GenerateResult,
} from "@/lib/brief";
import { sendBriefToTelegram } from "@/lib/telegram";
import { SKIP_CATEGORIES } from "./skip-categories";

// ---------------------------------------------------------------------------
// Brief generation (Step 3)
// ---------------------------------------------------------------------------

export async function generateBriefAction(): Promise<GenerateResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };

  const result = await generateBriefForToday(email);
  if (result.ok) revalidatePath("/today");
  return result;
}

// ---------------------------------------------------------------------------
// Telegram send (Step 6) — manual trigger for testing without waiting
// for cron. Cron uses the same lib/telegram path via /api/cron/morning-brief.
// ---------------------------------------------------------------------------

export type TelegramActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendBriefToTelegramAction(): Promise<TelegramActionResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };

  const brief = await getTodayBrief(email);
  if (!brief) {
    return {
      ok: false,
      error: "No brief generated for today yet. Generate one first.",
    };
  }

  const payload = brief.brief.payload as unknown as BriefPayload;
  return await sendBriefToTelegram(payload, brief.items);
}

// ---------------------------------------------------------------------------
// Task actions (Step 4) — PRD §12.4
// ---------------------------------------------------------------------------

export type TaskActionResult = { ok: true } | { ok: false; error: string };

// Verify the brief_item belongs to a brief owned by the signed-in user.
// Returns null if not found or not owned.
async function ownedItem(itemId: string, email: string) {
  const rows = await db
    .select({
      itemId: briefItems.id,
      briefUserId: briefs.userId,
    })
    .from(briefItems)
    .innerJoin(briefs, eq(briefItems.briefId, briefs.id))
    .where(eq(briefItems.id, itemId))
    .limit(1);
  const r = rows[0];
  if (!r || r.briefUserId !== email) return null;
  return r;
}

export async function markDoneAction(
  itemId: string,
): Promise<TaskActionResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };
  const owned = await ownedItem(itemId, email);
  if (!owned) return { ok: false, error: "Item not found" };

  await db
    .update(briefItems)
    .set({
      status: "done",
      skippedReasonCategory: null,
      skippedReasonText: null,
      deferredTo: null,
      deferredReason: null,
      updatedAt: new Date(),
    })
    .where(eq(briefItems.id, itemId));
  revalidatePath("/today");
  return { ok: true };
}

const skipSchema = z.object({
  category: z.enum(SKIP_CATEGORIES),
  reason: z.string().trim().min(1, "reason required"),
});

export async function markSkippedAction(
  itemId: string,
  formData: FormData,
): Promise<TaskActionResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };
  const owned = await ownedItem(itemId, email);
  if (!owned) return { ok: false, error: "Item not found" };

  const parsed = skipSchema.safeParse({
    category: formData.get("category")?.toString() ?? "",
    reason: formData.get("reason")?.toString() ?? "",
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message };
  }

  await db
    .update(briefItems)
    .set({
      status: "skipped",
      skippedReasonCategory: parsed.data.category,
      skippedReasonText: parsed.data.reason,
      deferredTo: null,
      deferredReason: null,
      updatedAt: new Date(),
    })
    .where(eq(briefItems.id, itemId));
  revalidatePath("/today");
  return { ok: true };
}

// Defer date accepted as YYYY-MM-DD (or full ISO if needed). Must be
// in the future (tomorrow or later, AEST-naive).
const deferSchema = z.object({
  deferredTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/, "must be a date"),
  reason: z.string().trim().min(1, "reason required"),
});

export async function markDeferredAction(
  itemId: string,
  formData: FormData,
): Promise<TaskActionResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };
  const owned = await ownedItem(itemId, email);
  if (!owned) return { ok: false, error: "Item not found" };

  const parsed = deferSchema.safeParse({
    deferredTo: formData.get("deferredTo")?.toString() ?? "",
    reason: formData.get("reason")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const str = parsed.data.deferredTo;
  // Parse as UTC midnight so toISOString().slice(0,10) matches what the
  // user picked regardless of where the server runs. (Without the Z, the
  // string is parsed as local time and the date can drift by a day when
  // server tz differs from client tz.)
  const deferDate = str.includes("T")
    ? new Date(str.endsWith("Z") ? str : `${str}Z`)
    : new Date(`${str}T00:00:00.000Z`);

  if (isNaN(deferDate.getTime())) {
    return { ok: false, error: "Invalid date" };
  }

  // Must be in the future. Use 1-day buffer for timezone tolerance.
  if (deferDate.getTime() < Date.now() - 86_400_000) {
    return { ok: false, error: "Defer date must be in the future" };
  }

  await db
    .update(briefItems)
    .set({
      status: "deferred",
      skippedReasonCategory: null,
      skippedReasonText: null,
      deferredTo: deferDate,
      deferredReason: parsed.data.reason,
      updatedAt: new Date(),
    })
    .where(eq(briefItems.id, itemId));
  revalidatePath("/today");
  return { ok: true };
}

export async function resetItemAction(
  itemId: string,
): Promise<TaskActionResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };
  const owned = await ownedItem(itemId, email);
  if (!owned) return { ok: false, error: "Item not found" };

  await db
    .update(briefItems)
    .set({
      status: "pending",
      skippedReasonCategory: null,
      skippedReasonText: null,
      deferredTo: null,
      deferredReason: null,
      updatedAt: new Date(),
    })
    .where(eq(briefItems.id, itemId));
  revalidatePath("/today");
  return { ok: true };
}
