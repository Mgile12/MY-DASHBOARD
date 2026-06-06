import { requireSession } from "@/lib/auth-session";
import { getTodayBrief, type BriefPayload } from "@/lib/brief";
import { aestToday, isAestSunday } from "@/lib/date";
import { GenerateButton } from "./generate-button";
import { TelegramButton } from "./telegram-button";
import { TaskItem, type SerializedBriefItem } from "./task-item";
import type { BriefItem } from "@/db/schema";
import {
  Card,
  FooterMeta,
  HeroStat,
  HonestCallout,
  PageHeader,
  PageShell,
  Section,
  VillainNote,
  WarningCard,
} from "@/app/_components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const { email } = await requireSession();
  const today = aestToday();
  const sunday = isAestSunday();

  return (
    <PageShell>
      <PageHeader
        title="Today"
        subtitle={`${email} · ${today} AEST`}
        current="today"
      />
      {sunday ? <SundayPlaceholder /> : <BriefSection email={email} />}
    </PageShell>
  );
}

async function BriefSection({ email }: { email: string }) {
  const data = await getTodayBrief(email);

  if (!data) {
    return (
      <div className="space-y-4">
        <Card>
          <p className="text-[14px] text-neutral-300 leading-relaxed">
            No brief generated for today yet. The cron generates it at 4am AEST.
            Generate it now if you want it earlier.
          </p>
        </Card>
        <GenerateButton />
      </div>
    );
  }

  const payload = data.brief.payload as unknown as BriefPayload;

  return (
    <div className="space-y-8">
      <PainBlock pb={payload.pain_block} />
      <SalesScoreboard ss={payload.sales_scoreboard} />
      <VillainNote text={payload.villain_note} />
      <HonestCallout text={payload.honest_callout} />
      <Top3 items={data.items} />
      {payload.watch_for && payload.watch_for.length > 0 && (
        <WatchFor items={payload.watch_for} />
      )}
      {payload.missed_journal_warning && (
        <WarningCard
          label="Missed journal"
          text={payload.missed_journal_warning}
        />
      )}

      <FooterMeta
        left={
          <span>
            Mode: <strong className="text-neutral-300">{payload.mode}</strong> ·{" "}
            Generated{" "}
            {data.brief.generatedAt
              ? formatAestTimestamp(data.brief.generatedAt)
              : "?"}
          </span>
        }
        right={
          <>
            <TelegramButton />
            <GenerateButton regenerate />
          </>
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sunday — the OODA Loop replaces the brief
// ---------------------------------------------------------------------------

function SundayPlaceholder() {
  return (
    <Card>
      <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-neutral-400">
        Sunday
      </div>
      <p className="mt-2 text-[16px] font-semibold text-neutral-50">
        No morning brief today.
      </p>
      <p className="mt-2 text-[14px] text-neutral-400 leading-relaxed">
        Per PRD §10.3, Sunday has no morning brief. The{" "}
        <Link
          href="/weekly"
          className="underline decoration-neutral-500 underline-offset-4 hover:text-neutral-200"
        >
          Sunday OODA Loop
        </Link>{" "}
        replaces it. Do that tonight.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Pain block — the scoreboard hero
// ---------------------------------------------------------------------------

function PainBlock({ pb }: { pb: BriefPayload["pain_block"] }) {
  const fmt = (n: number) =>
    n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

  const cur = Math.max(0, pb.current_monthly_revenue);
  const tgt = Math.max(1, pb.target_monthly_revenue);
  const fillPct = Math.min(100, (cur / tgt) * 100);
  const gapPct = Math.max(0, 100 - fillPct);

  return (
    <Section label="Pain">
      <HeroStat
        label={`Gap · ${pb.currency}/mo`}
        value={`$${fmt(pb.gap)}`}
        sub={`${pb.days_left_in_month} days left this month`}
      />
      <Card>
        <div className="flex items-baseline justify-between text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">
          <span>Current</span>
          <span>Target</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between text-[22px] font-extrabold tabular-nums">
          <span className="text-neutral-50">${fmt(cur)}</span>
          <span className="text-neutral-500">${fmt(tgt)}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-neutral-800 overflow-hidden flex">
          <div
            className="bg-neutral-50 h-full transition-[width] duration-500"
            style={{ width: `${fillPct}%` }}
          />
          <div
            className="bg-red-500 h-full"
            style={{ width: `${gapPct}%` }}
          />
        </div>
        <div className="mt-2 flex items-baseline justify-between text-[12px] text-neutral-500 tabular-nums">
          <span>{Math.round(fillPct)}% of target</span>
          <span className="text-red-400">${fmt(pb.gap)} short</span>
        </div>
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Sales scoreboard — stat grid, two columns, yesterday vs this week
// ---------------------------------------------------------------------------

function SalesScoreboard({
  ss,
}: {
  ss: BriefPayload["sales_scoreboard"];
}) {
  const fmt = (n: number) =>
    n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

  type Row = {
    label: string;
    yest: number;
    week: number;
    money?: boolean;
    tone?: "win-on-nonzero";
  };

  const rows: Row[] = [
    { label: "Calls", yest: ss.calls_yesterday, week: ss.calls_this_week },
    {
      label: "Follow-ups",
      yest: ss.followups_yesterday,
      week: ss.followups_this_week,
      tone: "win-on-nonzero",
    },
    {
      label: "Offers / proposals",
      yest: ss.offers_yesterday,
      week: ss.offers_this_week,
      tone: "win-on-nonzero",
    },
    {
      label: "One-off revenue",
      yest: ss.one_off_revenue_yesterday,
      week: ss.one_off_revenue_this_week,
      money: true,
      tone: "win-on-nonzero",
    },
    {
      label: "Recurring revenue",
      yest: ss.recurring_revenue_yesterday,
      week: ss.recurring_revenue_this_week,
      money: true,
      tone: "win-on-nonzero",
    },
  ];

  return (
    <Section label="Sales scoreboard">
      <Card>
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-3">
          <span></span>
          <span className="text-right text-[10px] font-semibold tracking-[0.14em] uppercase text-neutral-500">
            Yest
          </span>
          <span className="text-right text-[10px] font-semibold tracking-[0.14em] uppercase text-neutral-500">
            Week
          </span>

          {rows.map((row) => {
            const yestColor =
              row.tone === "win-on-nonzero" && row.yest > 0
                ? "text-green-400"
                : row.yest === 0
                  ? "text-neutral-700"
                  : "text-neutral-300";
            const weekColor =
              row.tone === "win-on-nonzero" && row.week > 0
                ? "text-green-400"
                : row.week === 0
                  ? "text-neutral-700"
                  : "text-neutral-50";
            return (
              <div key={row.label} className="contents">
                <span className="text-[14px] text-neutral-400">
                  {row.label}
                </span>
                <span
                  className={`text-right text-[17px] font-semibold tabular-nums ${yestColor}`}
                >
                  {row.money ? `$${fmt(row.yest)}` : fmt(row.yest)}
                </span>
                <span
                  className={`text-right text-[24px] font-extrabold tabular-nums ${weekColor}`}
                >
                  {row.money ? `$${fmt(row.week)}` : fmt(row.week)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Top 3
// ---------------------------------------------------------------------------

function Top3({ items }: { items: BriefItem[] }) {
  const serialized: SerializedBriefItem[] = items.map((i) => ({
    id: i.id,
    position: i.position,
    task: i.task,
    tag: i.tag,
    sigil: i.sigil,
    why: i.why,
    status: i.status,
    skippedReasonCategory: i.skippedReasonCategory,
    skippedReasonText: i.skippedReasonText,
    deferredTo: i.deferredTo ? i.deferredTo.toISOString() : null,
    deferredReason: i.deferredReason,
  }));

  return (
    <Section label="Top 3">
      <ol className="space-y-3">
        {serialized.map((item) => (
          <TaskItem key={item.id} item={item} />
        ))}
      </ol>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Watch For
// ---------------------------------------------------------------------------

function WatchFor({ items }: { items: string[] }) {
  return (
    <Section label="Watch for">
      <Card>
        <ul className="space-y-2 text-[14px] text-neutral-300">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-neutral-600">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Timestamp helper
// ---------------------------------------------------------------------------

function formatAestTimestamp(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "?";
  const AEST_OFFSET_MS = 10 * 60 * 60 * 1000;
  const a = new Date(date.getTime() + AEST_OFFSET_MS);
  const y = a.getUTCFullYear();
  const mo = String(a.getUTCMonth() + 1).padStart(2, "0");
  const day = String(a.getUTCDate()).padStart(2, "0");
  const hh = String(a.getUTCHours()).padStart(2, "0");
  const mm = String(a.getUTCMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day} ${hh}:${mm} AEST`;
}
