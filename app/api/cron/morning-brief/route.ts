import { NextRequest, NextResponse } from "next/server";
import {
  generateBriefForToday,
  getTodayBrief,
  type BriefPayload,
} from "@/lib/brief";
import { sendBriefToTelegram, sendTelegramMessage } from "@/lib/telegram";
import { isAestSunday, aestToday, aestDayOfWeek } from "@/lib/date";

export const dynamic = "force-dynamic";

/**
 * Vercel cron handler. Schedule lives in vercel.json:
 *   - "0 18 * * 0-4" → 4am AEST Mon-Fri (Sun-Thu 18:00 UTC)
 *   - "0 21 * * 5"   → 7am AEST Saturday (Fri 21:00 UTC)
 *
 * On each fire:
 *   1. Verify Vercel's Authorization header against CRON_SECRET.
 *   2. Refuse if AEST today is Sunday (defensive — the schedule
 *      shouldn't fire on Sunday but belts and braces).
 *   3. Generate today's brief for ALLOWED_EMAIL (idempotent — upsert).
 *   4. Send the Telegram summary.
 *   5. If anything fails, push the error to Telegram so it's visible.
 */
export async function GET(request: NextRequest) {
  // 1. Auth
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Skip Sunday
  if (isAestSunday()) {
    return NextResponse.json({
      skipped: "Sunday — no brief (PRD §10.3)",
      aest_date: aestToday(),
      aest_day_of_week: aestDayOfWeek(),
    });
  }

  // 3. Generate
  const email = process.env.ALLOWED_EMAIL;
  if (!email) {
    return NextResponse.json(
      { error: "ALLOWED_EMAIL not set" },
      { status: 500 },
    );
  }

  const genResult = await generateBriefForToday(email);
  if (!genResult.ok) {
    // Surface the failure via Telegram so the user knows something broke.
    await sendTelegramMessage(
      `Brief generation failed: ${genResult.error}\n\nFix and regenerate manually at /today.`,
    ).catch(() => {});
    return NextResponse.json({ error: genResult.error }, { status: 500 });
  }

  // 4. Fetch the freshly-generated brief and send it
  const brief = await getTodayBrief(email);
  if (!brief) {
    return NextResponse.json(
      { error: "Brief not found after generation" },
      { status: 500 },
    );
  }

  const payload = brief.brief.payload as unknown as BriefPayload;
  const tg = await sendBriefToTelegram(payload, brief.items);
  if (!tg.ok) {
    return NextResponse.json(
      {
        error: `Brief generated but Telegram delivery failed: ${tg.error}`,
        brief_id: brief.brief.id,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    brief_id: brief.brief.id,
    mode: brief.brief.mode,
    aest_date: aestToday(),
  });
}
