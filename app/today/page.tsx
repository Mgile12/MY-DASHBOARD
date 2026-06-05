import Link from "next/link";
import { auth } from "@/auth";
import { getTodayBrief, type BriefPayload } from "@/lib/brief";
import { aestToday, isAestSunday } from "@/lib/date";
import { GenerateButton } from "./generate-button";
import { TelegramButton } from "./telegram-button";
import { TaskItem, type SerializedBriefItem } from "./task-item";
import type { BriefItem } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return <main className="p-8">Not signed in.</main>;

  const today = aestToday();
  const sunday = isAestSunday();

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <Header email={email} today={today} />

      {sunday ? (
        <SundayPlaceholder />
      ) : (
        <BriefSection email={email} />
      )}
    </main>
  );
}

async function BriefSection({ email }: { email: string }) {
  const data = await getTodayBrief(email);

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded border border-neutral-200 p-5 text-sm text-neutral-700 bg-neutral-50">
          <p>
            No brief generated for today yet. The cron will land in Step 6 and
            generate this automatically at 4am AEST. Until then, generate
            manually below.
          </p>
        </div>
        <GenerateButton />
      </div>
    );
  }

  const payload = data.brief.payload as unknown as BriefPayload;

  return (
    <div className="flex flex-col gap-8">
      <PainBlock pb={payload.pain_block} />
      <SalesScoreboard ss={payload.sales_scoreboard} />
      <VillainNote note={payload.villain_note} />
      <HonestCallout text={payload.honest_callout} />
      <Top3 items={data.items} />
      {payload.watch_for && payload.watch_for.length > 0 && (
        <WatchFor items={payload.watch_for} />
      )}
      {payload.missed_journal_warning && (
        <MissedJournalWarning text={payload.missed_journal_warning} />
      )}

      <footer className="border-t border-neutral-200 pt-4 text-xs text-neutral-500 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Mode: <strong>{payload.mode}</strong> · Generated:{" "}
          {data.brief.generatedAt
            ? formatAestTimestamp(data.brief.generatedAt)
            : "unknown"}
        </span>
        <div className="flex items-start gap-3">
          <TelegramButton />
          <GenerateButton regenerate />
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function Header({ email, today }: { email: string; today: string }) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="text-sm text-neutral-500">
          {email} · AEST: {today}
        </p>
      </div>
      <nav className="flex items-center gap-5 text-sm">
        <Link href="/journal" className="text-neutral-700 hover:underline">
          Journal
        </Link>
        <Link href="/standards" className="text-neutral-700 hover:underline">
          Standards
        </Link>
        <Link href="/settings" className="text-neutral-700 hover:underline">
          Settings
        </Link>
      </nav>
    </header>
  );
}

function SundayPlaceholder() {
  return (
    <div className="rounded border border-neutral-300 p-5 bg-neutral-50 text-sm leading-6 text-neutral-800">
      <p className="font-semibold">Sunday — no morning brief.</p>
      <p className="mt-1 text-neutral-600">
        Per PRD §10.3, Sunday has no morning brief. The Sunday OODA review
        replaces it (Step 7 of the build). Until then, Sunday is rest.
      </p>
    </div>
  );
}

function PainBlock({
  pb,
}: {
  pb: BriefPayload["pain_block"];
}) {
  const cur = pb.current_monthly_revenue;
  const tgt = pb.target_monthly_revenue;
  const gap = pb.gap;
  const fmt = (n: number) =>
    n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

  return (
    <section className="border border-black p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-2">
        Pain
      </h2>
      <div className="grid grid-cols-2 gap-y-1 text-sm font-mono">
        <span>CURRENT</span>
        <span className="text-right">
          ${fmt(cur)} {pb.currency}/mo
        </span>
        <span>TARGET</span>
        <span className="text-right">
          ${fmt(tgt)} {pb.currency}/mo
        </span>
        <span className="font-bold">GAP</span>
        <span className="text-right font-bold">
          ${fmt(gap)} {pb.currency}/mo
        </span>
        <span>DAYS LEFT THIS MONTH</span>
        <span className="text-right">{pb.days_left_in_month}</span>
      </div>
    </section>
  );
}

function SalesScoreboard({
  ss,
}: {
  ss: BriefPayload["sales_scoreboard"];
}) {
  const fmt = (n: number) =>
    n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-3">
        Sales scoreboard
      </h2>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="font-semibold"></div>
        <div className="font-semibold text-center">Yesterday</div>
        <div className="font-semibold text-center">This week</div>

        <div>Calls</div>
        <div className="text-center font-mono">{fmt(ss.calls_yesterday)}</div>
        <div className="text-center font-mono">{fmt(ss.calls_this_week)}</div>

        <div>Follow-ups</div>
        <div className="text-center font-mono">{fmt(ss.followups_yesterday)}</div>
        <div className="text-center font-mono">{fmt(ss.followups_this_week)}</div>

        <div>Offers/proposals</div>
        <div className="text-center font-mono">{fmt(ss.offers_yesterday)}</div>
        <div className="text-center font-mono">{fmt(ss.offers_this_week)}</div>

        <div>One-off revenue</div>
        <div className="text-center font-mono">
          ${fmt(ss.one_off_revenue_yesterday)}
        </div>
        <div className="text-center font-mono">
          ${fmt(ss.one_off_revenue_this_week)}
        </div>

        <div>Recurring revenue</div>
        <div className="text-center font-mono">
          ${fmt(ss.recurring_revenue_yesterday)}
        </div>
        <div className="text-center font-mono">
          ${fmt(ss.recurring_revenue_this_week)}
        </div>
      </div>
    </section>
  );
}

function VillainNote({ note }: { note: string }) {
  return (
    <section className="border-l-4 border-black pl-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
        Villain
      </h2>
      <p className="mt-1 text-base font-semibold leading-snug">{note}</p>
    </section>
  );
}

function HonestCallout({ text }: { text: string }) {
  return (
    <section className="border-l-4 border-red-700 pl-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-red-700">
        Honest callout
      </h2>
      <p className="mt-1 text-base font-semibold leading-snug">{text}</p>
    </section>
  );
}

function Top3({ items }: { items: BriefItem[] }) {
  // Convert Drizzle BriefItem (with Date fields) → JSON-safe SerializedBriefItem
  // before crossing the RSC → Client Component boundary.
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
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-3">
        Top 3
      </h2>
      <ol className="flex flex-col gap-3">
        {serialized.map((item) => (
          <TaskItem key={item.id} item={item} />
        ))}
      </ol>
    </section>
  );
}

function WatchFor({ items }: { items: string[] }) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-2">
        Watch for
      </h2>
      <ul className="text-sm list-disc list-inside text-neutral-700">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function MissedJournalWarning({ text }: { text: string }) {
  return (
    <section className="rounded border border-amber-400 bg-amber-50 p-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-800 mb-1">
        Missed journal
      </h2>
      <p className="text-sm text-amber-900">{text}</p>
    </section>
  );
}

// Deterministic AEST timestamp formatter — avoids locale-dependent
// toLocaleString() output that varies between server (likely en-US/UTC)
// and what an Australian user expects.
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
