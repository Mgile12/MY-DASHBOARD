import type { BriefPayload } from "./brief";
import type { BriefItem } from "@/db/schema";

const TELEGRAM_API = "https://api.telegram.org";

export type TelegramSendResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Send a plain-text message to the configured Telegram chat. The
 * message is the morning brief summary. Bot token + chat id come
 * from env vars set in Vercel (Telegram bot must already have been
 * /start'd by the user — this is a one-time setup).
 */
export async function sendTelegramMessage(
  text: string,
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  if (!chatId) return { ok: false, error: "TELEGRAM_CHAT_ID not set" };

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        // Plain text — avoid the Markdown/HTML parse landmines for
        // user-generated content (Villain notes, callouts).
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        error: `Telegram ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// ---------------------------------------------------------------------------
// Brief → Telegram text
// ---------------------------------------------------------------------------

function fmtCurrency(n: number): string {
  return n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
}

function tagLabel(tag: string): string {
  switch (tag) {
    case "do":
      return "DO";
    case "delegate":
      return "DELEGATE";
    case "delete":
      return "DELETE";
    case "defer":
      return "DEFER";
    default:
      return tag.toUpperCase();
  }
}

/**
 * Format the brief as a short plain-text message suitable for a
 * Telegram DM. Goal: scannable in 5 seconds, clear link to the
 * full /today page for the rest.
 */
export function formatBriefForTelegram(
  payload: BriefPayload,
  items: BriefItem[],
  todayUrl: string,
): string {
  const pb = payload.pain_block;
  const ss = payload.sales_scoreboard;

  const lines: string[] = [];

  // Header
  const modeLabel =
    payload.mode === "saturday"
      ? "Saturday"
      : payload.mode === "missed_journal_reset"
        ? "Reset brief"
        : "Weekday";
  lines.push(`Morning. ${modeLabel} brief.`);
  lines.push("");

  // Pain block
  lines.push(
    `CURRENT $${fmtCurrency(pb.current_monthly_revenue)} · ` +
      `TARGET $${fmtCurrency(pb.target_monthly_revenue)} · ` +
      `GAP $${fmtCurrency(pb.gap)} · ` +
      `${pb.days_left_in_month}d left`,
  );
  lines.push("");

  // Sales scoreboard (compact)
  lines.push(
    `Calls y'day/wk: ${ss.calls_yesterday}/${ss.calls_this_week} · ` +
      `F/U: ${ss.followups_yesterday}/${ss.followups_this_week} · ` +
      `Offers: ${ss.offers_yesterday}/${ss.offers_this_week}`,
  );
  lines.push("");

  // Villain note
  if (payload.villain_note) {
    lines.push(`[VILLAIN] ${payload.villain_note}`);
    lines.push("");
  }

  // Honest callout
  if (payload.honest_callout) {
    lines.push(`[CALLOUT] ${payload.honest_callout}`);
    lines.push("");
  }

  // Top 3
  if (items.length > 0) {
    lines.push("TOP 3:");
    for (const item of items) {
      lines.push(`${item.position}. [${tagLabel(item.tag)}] ${item.task}`);
    }
    lines.push("");
  }

  // Missed journal warning
  if (payload.missed_journal_warning) {
    lines.push(`! ${payload.missed_journal_warning}`);
    lines.push("");
  }

  // Link
  lines.push(`Full brief: ${todayUrl}`);

  return lines.join("\n");
}

/**
 * Convenience wrapper — pulls today's brief, formats it, sends it.
 * Used by both the cron handler and the manual "Send to Telegram"
 * button on /today.
 */
export async function sendBriefToTelegram(
  payload: BriefPayload,
  items: BriefItem[],
): Promise<TelegramSendResult> {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "https://www.inhouseai.com.au";
  // Strip protocol if VERCEL_PROJECT_PRODUCTION_URL has none, add https
  const url = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const todayUrl = `${url.replace(/\/$/, "")}/today`;
  const text = formatBriefForTelegram(payload, items, todayUrl);
  return await sendTelegramMessage(text);
}
