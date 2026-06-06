import Anthropic from "@anthropic-ai/sdk";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  briefs,
  briefItems,
  journalEntries,
  standards,
  standardCheckins,
  userSettings,
  weeklyReviews,
  type WeeklyReview,
} from "@/db/schema";
import {
  computeStreak,
  seedDefaultStandards,
} from "./standards";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 3072;

const AEST_OFFSET_MS = 10 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function ymdAest(daysAgo: number): string {
  const t = new Date(Date.now() + AEST_OFFSET_MS - daysAgo * 86400000);
  const y = t.getUTCFullYear();
  const m = String(t.getUTCMonth() + 1).padStart(2, "0");
  const d = String(t.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function aestDow(): number {
  return new Date(Date.now() + AEST_OFFSET_MS).getUTCDay();
}

/** Monday of the current AEST week (YYYY-MM-DD). */
export function currentWeekStart(): string {
  const dow = aestDow();
  const daysBack = dow === 0 ? 6 : dow - 1;
  return ymdAest(daysBack);
}

/** Sunday of the current AEST week (YYYY-MM-DD). */
export function currentWeekEnd(): string {
  const dow = aestDow();
  const daysForward = dow === 0 ? 0 : 7 - dow;
  // forward from today → return ymdAest(-daysForward)
  const t = new Date(Date.now() + AEST_OFFSET_MS + daysForward * 86400000);
  const y = t.getUTCFullYear();
  const m = String(t.getUTCMonth() + 1).padStart(2, "0");
  const d = String(t.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysLeftInAestMonth(): number {
  const now = new Date(Date.now() + AEST_OFFSET_MS);
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Math.max(0, lastDay - now.getUTCDate());
}

// ---------------------------------------------------------------------------
// System prompt for the Sunday OODA Loop
// ---------------------------------------------------------------------------

const OODA_SYSTEM_PROMPT = `You are running Sunday OODA Loop review for Mitchell. He's a solo consultant in Australia trying to close the gap to $10k AUD/mo. The data in the user message covers the week being reviewed.

The user message has two kinds of signal:
- "reflections" — Mitchell's own answers to six OODA prompts (goal, wins, dodged, obstacles, plan, one_thing). This is his self-report of where he stands. Treat it as the primary signal for his head and intent.
- "observe" + "journals" + sales aggregates — the receipts. The data tells you WHAT happened. The reflections tell you what he THINKS happened.

Your job is to cross-reference the two. When his reflections line up with the data, name the pattern. When they conflict (e.g. he says he "made good progress" but the calls number is 0), call it out — that's the highest-value signal in the whole review.

Tone: brutal, direct, corrective. Inform ego, do not feed it. Reference receipts — numbers, dodges, named tasks. No flattery. No generic productivity advice.

Your job:
1. ORIENT — interpret the pattern. 3-5 sentences. What does the week actually say about how Mitchell operated? Where did the gap close? Where did he hide? Where do his reflections diverge from the data? Don't restate either — interpret them together.
2. DECIDE — one operating rule for next week. Specific. Actionable. Numerical when possible. Start from his stated plan and "one_thing" — but sharpen them, narrow them, or replace them if the data says something more important. Examples:
   - "8am-10am cold call block is non-negotiable. Hit 30+ calls every weekday or no client delivery work after lunch."
   - "Two proposals out by Wednesday. If Tuesday EOD shows zero, block all client work Wednesday morning."
   - "No website/internal work until the Acme follow-up is done and a third proposal is sent."
   The rule must be ONE thing. Not three. Not five.
3. REPORT_TEXT — 200-400 word weekly summary. Cover: scoreboard (calls/follow-ups/offers/revenue), what actually happened, what it means, repeated dodges, strongest receipts, where reflections diverged from receipts, next week's rule. Blunt. End with one sentence about what gets him to $10k.

Return ONLY this JSON. No markdown. No code fence.

{
  "orient": "string",
  "decide": {
    "next_week_rule": "string",
    "reasoning": "string (1-2 sentences why this rule, this week)"
  },
  "report_text": "string"
}`;

// ---------------------------------------------------------------------------
// Observe — computed from data, not from the AI
// ---------------------------------------------------------------------------

export type ObservePayload = {
  current_monthly_revenue: number;
  target_monthly_revenue: number;
  gap: number;
  days_left_in_month: number;
  currency: string;
  week_start: string;
  week_end: string;
  calls_this_week: number;
  followups_this_week: number;
  offers_this_week: number;
  one_off_revenue_this_week: number;
  recurring_revenue_this_week: number;
  training_completed: number;
  cold_call_blocks_completed: number;
  client_delivery_blocks_completed: number;
  journals_completed: number;
  expected_journal_days: number;
  skipped_tasks: number;
  deferred_tasks: number;
  repeated_dodges: string[];
  strongest_tale: { date: string; type: string; summary: string } | null;
  standards_streaks: { key: string; name: string; streak: number }[];
};

async function computeObserve(
  email: string,
  weekStart: string,
  weekEnd: string,
): Promise<ObservePayload> {
  const settingsRows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, email))
    .limit(1);
  const settings = settingsRows[0];

  const journals = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, email),
        gte(journalEntries.date, weekStart),
        lte(journalEntries.date, weekEnd),
      ),
    )
    .orderBy(asc(journalEntries.date));

  const weekBriefs = await db
    .select()
    .from(briefs)
    .where(
      and(
        eq(briefs.userId, email),
        gte(briefs.date, weekStart),
        lte(briefs.date, weekEnd),
      ),
    );

  const allItems =
    weekBriefs.length === 0
      ? []
      : await db
          .select()
          .from(briefItems)
          .where(
            // Items belonging to this week's briefs
            // Drizzle inArray would be cleaner but a plain join works fine
            eq(briefItems.briefId, weekBriefs[0].id),
          );

  // Pull items across all of this week's briefs (one query per brief is fine
  // — a week has at most 6 briefs)
  const weekItemsArrays = await Promise.all(
    weekBriefs.map((b) =>
      db.select().from(briefItems).where(eq(briefItems.briefId, b.id)),
    ),
  );
  const weekItems = weekItemsArrays.flat();

  // Standards + streaks (snapshot at the moment of OODA generation)
  const userStds = await db
    .select()
    .from(standards)
    .where(eq(standards.userId, email));

  const stdsWithStreaks = await Promise.all(
    userStds.map(async (s) => {
      const sixtyDaysAgo = ymdAest(60);
      const checkins = await db
        .select({
          date: standardCheckins.date,
          hit: standardCheckins.hit,
        })
        .from(standardCheckins)
        .where(
          and(
            eq(standardCheckins.standardId, s.id),
            gte(standardCheckins.date, sixtyDaysAgo),
          ),
        );
      const streak = s.active
        ? computeStreak(checkins, s.activeDays ?? [])
        : 0;
      return { key: s.key, name: s.name, streak };
    }),
  );

  // Aggregates
  const calls = journals.reduce((a, j) => a + (j.callsMade ?? 0), 0);
  const followups = journals.reduce(
    (a, j) => a + (j.followupsCompleted ?? 0),
    0,
  );
  const offers = journals.reduce((a, j) => a + (j.offersSent ?? 0), 0);
  const oneOff = journals.reduce(
    (a, j) => a + Number(j.oneOffRevenueWon ?? 0),
    0,
  );
  const recurring = journals.reduce(
    (a, j) => a + Number(j.recurringRevenueWon ?? 0),
    0,
  );
  const trainings = journals.filter((j) => j.trainingCompleted === true).length;
  const coldCalls = journals.filter(
    (j) => j.coldCallingCompleted === true,
  ).length;
  const clientBlocks = journals.filter(
    (j) => j.clientDeliveryCompleted === true,
  ).length;

  // Expected journal days for the week: count Mon-Sat between weekStart and
  // min(weekEnd, today)
  let expected = 0;
  const today = ymdAest(0);
  for (let d = new Date(weekStart); ; ) {
    const ymd =
      d.toISOString().slice(0, 10);
    if (ymd > weekEnd || ymd > today) break;
    const dow = d.getUTCDay();
    if (dow !== 0) expected++; // skip Sunday
    d.setUTCDate(d.getUTCDate() + 1);
  }

  // Skipped + deferred counts
  const skipped = weekItems.filter((i) => i.status === "skipped").length;
  const deferred = weekItems.filter((i) => i.status === "deferred").length;

  // Repeated dodges — tasks that appear in skipped/deferred 2+ times
  const dodgeCounts = new Map<string, number>();
  for (const item of weekItems) {
    if (item.status === "skipped" || item.status === "deferred") {
      const key = item.task.toLowerCase().slice(0, 80);
      dodgeCounts.set(key, (dodgeCounts.get(key) ?? 0) + 1);
    }
  }
  const repeatedDodges = Array.from(dodgeCounts.entries())
    .filter(([, n]) => n >= 2)
    .map(([task]) => task);

  // Strongest Tale of the week — first journal with tale_type set
  const taleJournal = journals.find(
    (j) => j.taleType === "victory" || j.taleType === "empowerment",
  );
  const strongest_tale = taleJournal
    ? {
        date: taleJournal.date,
        type: taleJournal.taleType ?? "",
        summary: (taleJournal.moneyMoved ?? "").slice(0, 200),
      }
    : null;

  const currentRev = Number(settings?.currentMonthlyRevenue ?? 0);
  const targetRev = Number(settings?.targetMonthlyRevenue ?? 0);

  return {
    current_monthly_revenue: currentRev,
    target_monthly_revenue: targetRev,
    gap: Math.max(0, targetRev - currentRev),
    days_left_in_month: daysLeftInAestMonth(),
    currency: settings?.currency || "AUD",
    week_start: weekStart,
    week_end: weekEnd,
    calls_this_week: calls,
    followups_this_week: followups,
    offers_this_week: offers,
    one_off_revenue_this_week: oneOff,
    recurring_revenue_this_week: recurring,
    training_completed: trainings,
    cold_call_blocks_completed: coldCalls,
    client_delivery_blocks_completed: clientBlocks,
    journals_completed: journals.length,
    expected_journal_days: expected,
    skipped_tasks: skipped,
    deferred_tasks: deferred,
    repeated_dodges: repeatedDodges,
    strongest_tale,
    standards_streaks: stdsWithStreaks,
  };
}

// ---------------------------------------------------------------------------
// AI generation
// ---------------------------------------------------------------------------

const ooadResponseSchema = z.object({
  orient: z.string(),
  decide: z.object({
    next_week_rule: z.string(),
    reasoning: z.string(),
  }),
  report_text: z.string(),
});

export type OodaResponse = z.infer<typeof ooadResponseSchema>;

export type GenerateOodaResult =
  | { ok: true; reviewId: string }
  | { ok: false; error: string };

// Mirror of app/weekly/labels.ts Reflections — kept here too so lib/
// doesn't import from app/. Both versions describe the same shape.
export type Reflections = {
  goal?: string;
  wins?: string;
  dodged?: string;
  obstacles?: string;
  plan?: string;
  one_thing?: string;
};

export async function generateOodaReview(
  email: string,
  reflections: Reflections = {},
): Promise<GenerateOodaResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY not set" };

  await seedDefaultStandards(email);
  const settingsRows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, email))
    .limit(1);
  const settings = settingsRows[0];
  if (!settings)
    return {
      ok: false,
      error: "Settings not initialised — visit /settings first",
    };

  const weekStart = currentWeekStart();
  const weekEnd = currentWeekEnd();

  const observe = await computeObserve(email, weekStart, weekEnd);

  // Build context for the AI
  const journals = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, email),
        gte(journalEntries.date, weekStart),
        lte(journalEntries.date, weekEnd),
      ),
    )
    .orderBy(asc(journalEntries.date));

  const userPayload = {
    today_date: ymdAest(0),
    week_start: weekStart,
    week_end: weekEnd,
    villain: settings.villainDescription || "(no villain set)",
    reflections: {
      goal: reflections.goal ?? "",
      wins: reflections.wins ?? "",
      dodged: reflections.dodged ?? "",
      obstacles: reflections.obstacles ?? "",
      plan: reflections.plan ?? "",
      one_thing: reflections.one_thing ?? "",
    },
    observe,
    journals: journals.map((j) => ({
      date: j.date,
      money_moved: j.moneyMoved,
      calls_made: j.callsMade ?? 0,
      followups_completed: j.followupsCompleted ?? 0,
      followups_notes: j.followupsNotes,
      offers_sent: j.offersSent ?? 0,
      one_off_revenue_won: Number(j.oneOffRevenueWon ?? 0),
      recurring_revenue_won: Number(j.recurringRevenueWon ?? 0),
      dodged: j.dodged,
      reactive_pulls: j.reactivePulls,
      tomorrow_must: j.tomorrowMust,
      training_completed: j.trainingCompleted ?? false,
      cold_calling_completed: j.coldCallingCompleted ?? false,
      client_delivery_completed: j.clientDeliveryCompleted ?? false,
      client_delivery_notes: j.clientDeliveryNotes,
      tale_type: j.taleType,
    })),
  };

  const userMessage =
    "Run my Sunday OODA Loop from this data. Cross-reference my reflections " +
    "(what I think happened) against the observe + journals (what actually " +
    "happened). Return only the JSON object.\n\n" +
    JSON.stringify(userPayload, null, 2);

  const anthropic = new Anthropic({ apiKey });

  let responseText: string;
  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: OODA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = resp.content[0];
    responseText = block && block.type === "text" ? block.text : "";
  } catch (e) {
    return {
      ok: false,
      error: `Anthropic API error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const cleaned = responseText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      ok: false,
      error: `Model returned non-JSON: ${cleaned.slice(0, 300)}`,
    };
  }

  const result = ooadResponseSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    return {
      ok: false,
      error: `Schema mismatch — ${first.path.join(".")}: ${first.message}`,
    };
  }

  const ooda = result.data;

  try {
    const reviewRows = await db
      .insert(weeklyReviews)
      .values({
        userId: email,
        weekStart,
        weekEnd,
        reflections,
        observe,
        orient: ooda.orient,
        decisions: ooda.decide,
        nextWeekRule: ooda.decide.next_week_rule,
        reportText: ooda.report_text,
      })
      .onConflictDoUpdate({
        target: [weeklyReviews.userId, weeklyReviews.weekStart],
        set: {
          weekEnd,
          reflections,
          observe,
          orient: ooda.orient,
          decisions: ooda.decide,
          nextWeekRule: ooda.decide.next_week_rule,
          reportText: ooda.report_text,
        },
      })
      .returning();

    return { ok: true, reviewId: reviewRows[0].id };
  } catch (e) {
    return {
      ok: false,
      error: `Database error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getCurrentWeekReview(
  email: string,
): Promise<WeeklyReview | null> {
  const weekStart = currentWeekStart();
  const rows = await db
    .select()
    .from(weeklyReviews)
    .where(
      and(
        eq(weeklyReviews.userId, email),
        eq(weeklyReviews.weekStart, weekStart),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * The most recent saved next_week_rule from any prior weekly_review.
 * Used by brief generation as `weekly_operating_rule` in the AI context.
 * Returns empty string if no rule has been set yet.
 */
export async function getCurrentOperatingRule(
  email: string,
): Promise<string> {
  const rows = await db
    .select({ rule: weeklyReviews.nextWeekRule })
    .from(weeklyReviews)
    .where(eq(weeklyReviews.userId, email))
    .orderBy(desc(weeklyReviews.weekStart))
    .limit(1);
  return rows[0]?.rule ?? "";
}
