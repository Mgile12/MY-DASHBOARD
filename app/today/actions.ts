"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { briefs, briefItems } from "@/db/schema";
import { generateBriefForToday, type GenerateResult } from "@/lib/brief";

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
// Task actions (Step 4) — PRD §12.4
// ---------------------------------------------------------------------------

export type TaskActionResult = { ok: true } | { ok: false; error: string };

// PRD §12.4 skip categories
export const SKIP_CATEGORIES = [
  "avoided_it",
  "genuinely_impossible",
  "client_emergency",
  "family_personal",
  "wrong_priority",
  "unclear_task",
  "other",
] as const;

export type SkipCategory = (typeof SKIP_CATEGORIES)[number];

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
  const deferDate = str.includes("T")
    ? new Date(str)
    : new Date(`${str}T00:00:00`);

  if (isNaN(deferDate.getTime())) {
    return { ok: false, error: "Invalid date" };
  }

  // Must be in the future. Use 1-hour buffer to avoid timezone gotchas.
  if (deferDate.getTime() < Date.now() - 3600_000) {
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
