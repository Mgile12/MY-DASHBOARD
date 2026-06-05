import Anthropic from "@anthropic-ai/sdk";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  briefs,
  briefItems,
  journalEntries,
  userSettings,
  type Brief,
  type BriefItem,
  type JournalEntry,
} from "@/db/schema";
import { aestToday, aestDayOfWeek } from "@/lib/date";
import { DEFAULT_SYSTEM_PROMPT } from "./default-system-prompt";

// Model — per PRD §19.1. If the model name shifts, update here.
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BriefMode = "weekday" | "saturday" | "missed_journal_reset";

const TAGS = ["do", "delegate", "delete", "defer"] as const;

const briefPayloadSchema = z.object({
  mode: z.enum(["weekday", "saturday", "missed_journal_reset"]),
  pain_block: z.object({
    current_monthly_revenue: z.number(),
    target_monthly_revenue: z.number(),
    gap: z.number(),
    days_left_in_month: z.number(),
    currency: z.string(),
  }),
  sales_scoreboard: z.object({
    calls_yesterday: z.number(),
    calls_this_week: z.number(),
    followups_yesterday: z.number(),
    followups_this_week: z.number(),
    offers_yesterday: z.number(),
    offers_this_week: z.number(),
    one_off_revenue_yesterday: z.number(),
    one_off_revenue_this_week: z.number(),
    recurring_revenue_yesterday: z.number(),
    recurring_revenue_this_week: z.number(),
  }),
  villain_note: z.string(),
  honest_callout: z.string(),
  top_3: z
    .array(
      z.object({
        task: z.string(),
        tag: z.enum(TAGS),
        sigil: z.string().nullable(),
        why: z.string(),
      }),
    )
    .length(3),
  watch_for: z.array(z.string()).max(5).default([]),
  missed_journal_warning: z.string().nullable(),
});

export type BriefPayload = z.infer<typeof briefPayloadSchema>;

export type BriefWithItems = { brief: Brief; items: BriefItem[] };

export type GenerateResult =
  | { ok: true; briefId: string }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Date helpers (AEST-aware)
// ---------------------------------------------------------------------------

function ymdAest(daysAgo: number): string {
  // returns YYYY-MM-DD for (AEST today - daysAgo days)
  const AEST_OFFSET_MS = 10 * 60 * 60 * 1000;
  const t = new Date(Date.now() + AEST_OFFSET_MS - daysAgo * 86400000);
  const y = t.getUTCFullYear();
  const m = String(t.getUTCMonth() + 1).padStart(2, "0");
  const d = String(t.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfAestWeek(): string {
  // Monday of the current AEST week. Week boundary: Mon 00:00 AEST.
  const AEST_OFFSET_MS = 10 * 60 * 60 * 1000;
  const now = new Date(Date.now() + AEST_OFFSET_MS);
  const dow = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysToMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(now.getTime() - daysToMonday * 86400000);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const d = String(monday.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysLeftInAestMonth(): number {
  const AEST_OFFSET_MS = 10 * 60 * 60 * 1000;
  const now = new Date(Date.now() + AEST_OFFSET_MS);
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  // Last day of this month
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const todayDay = now.getUTCDate();
  return Math.max(0, lastDay - todayDay);
}

// ---------------------------------------------------------------------------
// Context assembly
// ---------------------------------------------------------------------------

async function fetchContext(email: string) {
  const settingsRows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, email))
    .limit(1);

  // Pull the last 14 days of journals — used for "this week", "yesterday",
  // and missed-journal detection.
  const fourteenDaysAgo = ymdAest(14);
  const today = aestToday();
  const journals = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, email),
        gte(journalEntries.date, fourteenDaysAgo),
        lte(journalEntries.date, today),
      ),
    )
    .orderBy(desc(journalEntries.date));

  return { settings: settingsRows[0] ?? null, journals };
}

// Walk backwards from yesterday (AEST) and count consecutive days
// without a journal entry. Sundays are not counted as "missed" (per PRD
// no journal expected on Sundays). Saturday IS counted (journal is
// expected Mon-Sat).
function computeMissedJournals(journals: JournalEntry[]): {
  consecutive: number;
  inLast7: number;
} {
  const dates = new Set(journals.map((j) => j.date));
  const AEST_OFFSET_MS = 10 * 60 * 60 * 1000;

  let consecutive = 0;
  for (let i = 1; i <= 14; i++) {
    const t = new Date(Date.now() + AEST_OFFSET_MS - i * 86400000);
    const dow = t.getUTCDay();
    if (dow === 0) continue; // Sundays skipped
    const ymd = ymdAest(i);
    if (dates.has(ymd)) break; // hit a logged day — streak ends
    consecutive++;
  }

  // Total missed days in last 7 (Sundays excluded)
  let inLast7 = 0;
  for (let i = 1; i <= 7; i++) {
    const t = new Date(Date.now() + AEST_OFFSET_MS - i * 86400000);
    if (t.getUTCDay() === 0) continue;
    const ymd = ymdAest(i);
    if (!dates.has(ymd)) inLast7++;
  }

  return { consecutive, inLast7 };
}

function computeMode(consecutiveMissed: number): BriefMode {
  if (consecutiveMissed >= 3) return "missed_journal_reset";
  const dow = aestDayOfWeek();
  if (dow === 6) return "saturday";
  return "weekday";
}

function computeAggregates(journals: JournalEntry[]) {
  const yesterday = ymdAest(1);
  const weekStart = startOfAestWeek();
  const today = aestToday();

  const yest = journals.find((j) => j.date === yesterday);

  const thisWeek = journals.filter(
    (j) => j.date >= weekStart && j.date < today,
  );

  const sum = (arr: JournalEntry[], pick: (j: JournalEntry) => number) =>
    arr.reduce((acc, j) => acc + pick(j), 0);

  return {
    calls_yesterday: yest?.callsMade ?? 0,
    calls_this_week: sum(thisWeek, (j) => j.callsMade ?? 0),
    followups_yesterday: yest?.followupsCompleted ?? 0,
    followups_this_week: sum(thisWeek, (j) => j.followupsCompleted ?? 0),
    offers_yesterday: yest?.offersSent ?? 0,
    offers_this_week: sum(thisWeek, (j) => j.offersSent ?? 0),
    one_off_revenue_yesterday: Number(yest?.oneOffRevenueWon ?? 0),
    one_off_revenue_this_week: sum(thisWeek, (j) =>
      Number(j.oneOffRevenueWon ?? 0),
    ),
    recurring_revenue_yesterday: Number(yest?.recurringRevenueWon ?? 0),
    recurring_revenue_this_week: sum(thisWeek, (j) =>
      Number(j.recurringRevenueWon ?? 0),
    ),
  };
}

// ---------------------------------------------------------------------------
// Anthropic call + persistence
// ---------------------------------------------------------------------------

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function generateBriefForToday(
  email: string,
): Promise<GenerateResult> {
  const dow = aestDayOfWeek();
  if (dow === 0) {
    return {
      ok: false,
      error: "Sunday OODA replaces the morning brief (PRD §10.3).",
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY not set" };

  const { settings, journals } = await fetchContext(email);
  if (!settings)
    return { ok: false, error: "Settings not initialised — visit /settings first" };

  const missed = computeMissedJournals(journals);
  const mode = computeMode(missed.consecutive);
  const aggregates = computeAggregates(journals);
  const today = aestToday();

  // Substitute villain placeholder
  const systemPromptTemplate = settings.systemPrompt?.trim()
    ? settings.systemPrompt
    : DEFAULT_SYSTEM_PROMPT;
  const systemPrompt = systemPromptTemplate.replace(
    /\{\{\s*villain\s*\}\}/g,
    settings.villainDescription || "(no villain description set)",
  );

  // Build user message — structured data the AI reads
  const currentRev = Number(settings.currentMonthlyRevenue ?? 0);
  const targetRev = Number(settings.targetMonthlyRevenue ?? 0);
  const userPayload = {
    today_date: today,
    day_of_week: DAY_NAMES[dow],
    mode,
    weekly_operating_rule: "", // empty until Sunday OODA exists (Step 7)
    pain: {
      current_monthly_revenue: currentRev,
      target_monthly_revenue: targetRev,
      gap: Math.max(0, targetRev - currentRev),
      days_left_in_month: daysLeftInAestMonth(),
      currency: settings.currency || "AUD",
    },
    sales_aggregates: aggregates,
    missed_journals_consecutive: missed.consecutive,
    missed_journals_in_last_7: missed.inLast7,
    journals_last_14_days: journals.slice(0, 14).map((j) => ({
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
      client_delivery_completed: j.clientDeliveryCompleted ?? false,
      client_delivery_notes: j.clientDeliveryNotes,
      training_completed: j.trainingCompleted ?? false,
      cold_calling_completed: j.coldCallingCompleted ?? false,
      tale_type: j.taleType,
    })),
  };

  const userMessage =
    "Generate my brief from this data. Return only the JSON object per the schema.\n\n" +
    JSON.stringify(userPayload, null, 2);

  // Anthropic call
  const anthropic = new Anthropic({ apiKey });
  let responseText: string;
  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
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

  // Strip code fences if model added them despite instructions
  const cleaned = responseText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    return {
      ok: false,
      error: `Model returned non-JSON: ${cleaned.slice(0, 300)}`,
    };
  }

  const parsed = briefPayloadSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: `Schema mismatch in AI response — ${first.path.join(".")}: ${first.message}`,
    };
  }

  const payload = parsed.data;

  // Persist
  try {
    const briefRows = await db
      .insert(briefs)
      .values({
        userId: email,
        date: today,
        mode,
        payload,
      })
      .onConflictDoUpdate({
        target: [briefs.userId, briefs.date],
        set: {
          mode,
          payload,
          generatedAt: new Date(),
          openedAt: null,
        },
      })
      .returning();

    const brief = briefRows[0];
    if (!brief) throw new Error("Insert returned no row");

    // Clear existing items (re-generation safety)
    await db.delete(briefItems).where(eq(briefItems.briefId, brief.id));

    // Insert new items
    for (let i = 0; i < payload.top_3.length; i++) {
      const item = payload.top_3[i];
      await db.insert(briefItems).values({
        briefId: brief.id,
        position: i + 1,
        task: item.task,
        tag: item.tag,
        sigil: item.sigil ?? null,
        why: item.why,
      });
    }

    return { ok: true, briefId: brief.id };
  } catch (e) {
    return {
      ok: false,
      error: `Database error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function getTodayBrief(
  email: string,
): Promise<BriefWithItems | null> {
  const today = aestToday();
  const briefRows = await db
    .select()
    .from(briefs)
    .where(and(eq(briefs.userId, email), eq(briefs.date, today)))
    .limit(1);

  const brief = briefRows[0];
  if (!brief) return null;

  const items = await db
    .select()
    .from(briefItems)
    .where(eq(briefItems.briefId, brief.id))
    .orderBy(asc(briefItems.position));

  return { brief, items };
}
