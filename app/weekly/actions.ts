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
  type Reflections,
} from "@/lib/weekly";
import {
  BEHAVIOUR_OPTIONS,
  REFLECTION_QUESTIONS,
  USEFULNESS_OPTIONS,
} from "./labels";

// ---------------------------------------------------------------------------
// Generate (or regenerate) the Sunday OODA Loop from user reflections.
// PRD §12.8: AI uses the user's reflections plus the computed Observe
// to produce Orient + Decide + report.
// ---------------------------------------------------------------------------

function reflectionsSchema() {
  // Build a Zod object dynamically from REFLECTION_QUESTIONS so the
  // form labels and validation can never drift.
  const shape: Record<string, z.ZodType<string>> = {};
  for (const q of REFLECTION_QUESTIONS) {
    shape[q.key] = q.required
      ? z.string().trim().min(1, `${q.label} required`)
      : z.string().trim().optional().transform((v) => v ?? "");
  }
  return z.object(shape);
}

export async function generateOodaAction(
  formData: FormData,
): Promise<GenerateOodaResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };

  const raw: Record<string, string> = {};
  for (const q of REFLECTION_QUESTIONS) {
    raw[q.key] = formData.get(q.key)?.toString() ?? "";
  }

  const parsed = reflectionsSchema().safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const reflections = parsed.data as Reflections;
  const result = await generateOodaReview(email, reflections);
  if (result.ok) revalidatePath("/weekly");
  return result;
}

// ---------------------------------------------------------------------------
// Regenerate using the reflections already stored on this week's review row.
// Used by the in-page "Regenerate OODA Loop" button when a review exists.
// If reflections were never saved (legacy row), errors out cleanly.
// ---------------------------------------------------------------------------

export async function regenerateOodaAction(): Promise<GenerateOodaResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };

  const weekStart = currentWeekStart();
  const rows = await db
    .select({ reflections: weeklyReviews.reflections })
    .from(weeklyReviews)
    .where(
      and(
        eq(weeklyReviews.userId, email),
        eq(weeklyReviews.weekStart, weekStart),
      ),
    )
    .limit(1);

  if (!rows[0] || !rows[0].reflections) {
    return {
      ok: false,
      error:
        "No saved reflections to regenerate from. Use 'Edit reflections and regenerate' instead.",
    };
  }

  const result = await generateOodaReview(
    email,
    rows[0].reflections as Reflections,
  );
  if (result.ok) revalidatePath("/weekly");
  return result;
}

// ---------------------------------------------------------------------------
// Save edits to the current week's review (rule + ratings).
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
        error: "No OODA Loop review for this week yet — generate one first.",
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
