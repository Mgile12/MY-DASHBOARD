import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import {
  standards,
  standardCheckins,
  type Standard,
} from "@/db/schema";

// Day-of-week strings used in standards.activeDays (PostgreSQL text[]).
const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const AEST_OFFSET_MS = 10 * 60 * 60 * 1000;

function aestDateMinusDays(daysAgo: number): { ymd: string; dow: number } {
  const t = new Date(Date.now() + AEST_OFFSET_MS - daysAgo * 86400000);
  const y = t.getUTCFullYear();
  const m = String(t.getUTCMonth() + 1).padStart(2, "0");
  const d = String(t.getUTCDate()).padStart(2, "0");
  return { ymd: `${y}-${m}-${d}`, dow: t.getUTCDay() };
}

export function aestDayName(daysAgo = 0): string {
  return DAY_NAMES[aestDateMinusDays(daysAgo).dow];
}

// ---------------------------------------------------------------------------
// Default standards — PRD §12.7
// ---------------------------------------------------------------------------

export const DEFAULT_STANDARDS = [
  {
    key: "training",
    name: "Training",
    description:
      "Train 5 days a week — 4 strength + 1 cardio per the Villain.",
    activeDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  },
  {
    key: "nightly_journal",
    name: "Nightly journal",
    description: "Fill out tonight's journal before bed.",
    activeDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
  },
  {
    key: "cold_calling_30min",
    name: "Cold calling 30 minutes",
    description: "8am–10am Mon–Fri. The calls happen.",
    activeDays: ["mon", "tue", "wed", "thu", "fri"],
  },
  {
    key: "calls_made",
    name: "Calls made",
    description: "At least one cold call logged today.",
    activeDays: ["mon", "tue", "wed", "thu", "fri"],
  },
  {
    key: "client_delivery_block",
    name: "Client delivery block",
    description: "EFA work block completed Mon–Fri.",
    activeDays: ["mon", "tue", "wed", "thu", "fri"],
  },
] as const;

export type DefaultStandardKey = (typeof DEFAULT_STANDARDS)[number]["key"];

// Idempotent — does nothing if any standards already exist for this user.
// Called from settings/page.tsx (first login), standards/page.tsx
// (defensive), journal/actions.ts (defensive before writing check-ins),
// and lib/brief.ts (defensive before reading standards in context).
export async function seedDefaultStandards(userId: string): Promise<void> {
  const existing = await db
    .select({ id: standards.id })
    .from(standards)
    .where(eq(standards.userId, userId))
    .limit(1);
  if (existing[0]) return;

  await db.insert(standards).values(
    DEFAULT_STANDARDS.map((s) => ({
      userId,
      key: s.key,
      name: s.name,
      description: s.description,
      // spread to convert the readonly `as const` tuple to a mutable array
      activeDays: [...s.activeDays],
    })),
  );
}

// ---------------------------------------------------------------------------
// Streak math
// ---------------------------------------------------------------------------

/**
 * Walks backwards from yesterday for up to `lookbackDays`. Days not in
 * the standard's active_days are SKIPPED (don't count, don't break).
 * Active days with hit=true increment the streak. Active days with a
 * missing checkin or hit=false break the streak.
 *
 * Per PRD §12.7: "Streaks only count on active days."
 * Per PRD §18.5: "Cold calling does not break on weekends."
 */
export function computeStreak(
  checkins: { date: string; hit: boolean }[],
  activeDays: string[],
  lookbackDays = 60,
): number {
  const byDate = new Map(checkins.map((c) => [c.date, c.hit]));
  let streak = 0;
  for (let i = 1; i <= lookbackDays; i++) {
    const { ymd, dow } = aestDateMinusDays(i);
    const dayName = DAY_NAMES[dow];
    if (!activeDays.includes(dayName)) continue;
    const hit = byDate.get(ymd);
    if (hit === true) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

export type StandardWithStreak = Standard & { streak: number };

export async function getStandardsWithStreaks(
  userId: string,
): Promise<StandardWithStreak[]> {
  const stds = await db
    .select()
    .from(standards)
    .where(eq(standards.userId, userId))
    .orderBy(asc(standards.name));

  if (stds.length === 0) return [];

  const sixtyDaysAgo = aestDateMinusDays(60).ymd;

  const results: StandardWithStreak[] = [];
  for (const s of stds) {
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
    results.push({ ...s, streak });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Write helper — used by journal/actions.ts
// ---------------------------------------------------------------------------

export type CheckinUpdate = {
  key: DefaultStandardKey;
  hit: boolean;
  value?: string | null;
};

/**
 * For a given date, upserts standard_checkins rows for the listed standards.
 * Skips standards that don't exist for the user or aren't active on the
 * given day. Idempotent — called every time a journal is submitted.
 */
export async function writeStandardCheckins(
  userId: string,
  date: string,
  updates: CheckinUpdate[],
): Promise<void> {
  const userStds = await db
    .select({
      id: standards.id,
      key: standards.key,
      activeDays: standards.activeDays,
      active: standards.active,
    })
    .from(standards)
    .where(eq(standards.userId, userId));

  if (userStds.length === 0) return;

  // Compute day-of-week for the given date (interpret as AEST midnight)
  const t = new Date(`${date}T00:00:00.000Z`);
  if (isNaN(t.getTime())) return;
  const dayName = DAY_NAMES[t.getUTCDay()];

  for (const u of updates) {
    const std = userStds.find((s) => s.key === u.key);
    if (!std || !std.active) continue;
    if (!std.activeDays?.includes(dayName)) continue;

    await db
      .insert(standardCheckins)
      .values({
        standardId: std.id,
        date,
        hit: u.hit,
        value: u.value ?? null,
      })
      .onConflictDoUpdate({
        target: [standardCheckins.standardId, standardCheckins.date],
        set: { hit: u.hit, value: u.value ?? null },
      });
  }
}
