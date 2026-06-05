// Australia/Brisbane is a fixed UTC+10 offset (no DST in Queensland).
// All "today" / day-of-week logic uses AEST regardless of where the
// code runs (local dev, Vercel UTC, etc.).

const AEST_OFFSET_MS = 10 * 60 * 60 * 1000;

function aestNow(): Date {
  return new Date(Date.now() + AEST_OFFSET_MS);
}

/** YYYY-MM-DD in AEST. */
export function aestToday(): string {
  const d = aestNow();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 0 = Sunday, 1 = Monday, ..., 6 = Saturday. */
export function aestDayOfWeek(): number {
  return aestNow().getUTCDay();
}

export function isAestSunday(): boolean {
  return aestDayOfWeek() === 0;
}

export function isAestSaturday(): boolean {
  return aestDayOfWeek() === 6;
}

export function isAestWeekday(): boolean {
  const d = aestDayOfWeek();
  return d >= 1 && d <= 5;
}
