"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { weeklyReviews } from "@/db/schema";
import {
  currentWeekStart,
  generateOodaReview,
  type GenerateOodaResult,
} from "@/lib/weekly";
import { BEHAVIOUR_OPTIONS, USEFULNESS_OPTIONS } from "./labels";

// ---------------------------------------------------------------------------
// Generate (or regenerate) — calls Anthropic, upserts the weekly_review row.
// ---------------------------------------------------------------------------

export async function generateOodaAction(): Promise<GenerateOodaResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };

  const result = await generateOodaReview(email);
  if (result.ok) revalidatePath("/weekly");
  return result;
}

// ---------------------------------------------------------------------------
// Save edits to the current week's review.
// PRD §12.8: user can accept or edit the AI's next-week rule.
// PRD §16.1: usefulness + behaviour-changed ratings are the "brutally
// useful" proxy.
// ---------------------------------------------------------------------------

const saveSchema = z.object({
  nextWeekRule: z.string().trim().min(1, "Operating rule required"),
  usefulnessRating: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v))
    .refine(
      (v) =>
        v === null ||
        (USEFULNESS_OPTIONS as readonly string[]).includes(v),
      "Invalid usefulness rating",
    ),
  behaviourChangedRating: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v))
    .refine(
      (v) =>
        v === null || (BEHAVIOUR_OPTIONS as readonly string[]).includes(v),
      "Invalid behaviour-changed rating",
    ),
});

export type SaveOodaResult = { ok: true } | { ok: false; error: string };

export async function saveOodaAction(
  formData: FormData,
): Promise<SaveOodaResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };

  const parsed = saveSchema.safeParse({
    nextWeekRule: formData.get("nextWeekRule")?.toString() ?? "",
    usefulnessRating: formData.get("usefulnessRating")?.toString() ?? "",
    behaviourChangedRating:
      formData.get("behaviourChangedRating")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const weekStart = currentWeekStart();
  try {
    const result = await db
      .update(weeklyReviews)
      .set({
        nextWeekRule: parsed.data.nextWeekRule,
        usefulnessRating: parsed.data.usefulnessRating,
        behaviourChangedRating: parsed.data.behaviourChangedRating,
      })
      .where(
        and(
          eq(weeklyReviews.userId, email),
          eq(weeklyReviews.weekStart, weekStart),
        ),
      )
      .returning({ id: weeklyReviews.id });

    if (result.length === 0) {
      return {
        ok: false,
        error: "No OODA review for this week yet — generate one first.",
      };
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Database error",
    };
  }

  revalidatePath("/weekly");
  return { ok: true };
}
