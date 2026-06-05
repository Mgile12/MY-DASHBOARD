import Link from "next/link";
import { auth } from "@/auth";
import { aestToday } from "@/lib/date";
import {
  currentWeekStart,
  currentWeekEnd,
  getCurrentWeekReview,
  type ObservePayload,
} from "@/lib/weekly";
import { GenerateOodaButton } from "./generate-button";
import { OodaForm } from "./form";
import {
  BEHAVIOUR_OPTIONS,
  USEFULNESS_OPTIONS,
  type BehaviourChangedRating,
  type UsefulnessRating,
} from "./labels";

export const dynamic = "force-dynamic";

export default async function WeeklyPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return <main className="p-8">Not signed in.</main>;

  const today = aestToday();
  const weekStart = currentWeekStart();
  const weekEnd = currentWeekEnd();
  const review = await getCurrentWeekReview(email);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <Header
        email={email}
        today={today}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />

      {review === null ? <EmptyState /> : <ReviewView review={review} />}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Header / nav
// ---------------------------------------------------------------------------

function Header({
  email,
  today,
  weekStart,
  weekEnd,
}: {
  email: string;
  today: string;
  weekStart: string;
  weekEnd: string;
}) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Sunday OODA</h1>
        <p className="text-sm text-neutral-500">
          {email} · week of {weekStart} – {weekEnd} · today (AEST): {today}
        </p>
      </div>
      <nav className="flex items-center gap-5 text-sm">
        <Link href="/today" className="text-neutral-700 hover:underline">
          Today
        </Link>
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

// ---------------------------------------------------------------------------
// Empty state — no review for this week yet
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded border border-neutral-200 p-5 text-sm text-neutral-700 bg-neutral-50 leading-6">
        <p className="font-semibold">No OODA review for this week yet.</p>
        <p className="mt-1 text-neutral-600">
          The AI will read this week&apos;s journals, briefs, sales numbers,
          and standards, then produce: Observe (the scoreboard), Orient (what
          the pattern means), and Decide (next week&apos;s operating rule).
          You can edit the rule before saving.
        </p>
      </div>
      <GenerateOodaButton />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review view — Observe + Orient + Decide form + report
// ---------------------------------------------------------------------------

type DecisionsJson = { next_week_rule?: string; reasoning?: string };

function ReviewView({
  review,
}: {
  review: NonNullable<Awaited<ReturnType<typeof getCurrentWeekReview>>>;
}) {
  const observe = review.observe as unknown as ObservePayload;
  const decisions = (review.decisions ?? {}) as DecisionsJson;

  const usefulnessInitial = isUsefulness(review.usefulnessRating)
    ? review.usefulnessRating
    : "";
  const behaviourInitial = isBehaviour(review.behaviourChangedRating)
    ? review.behaviourChangedRating
    : "";

  return (
    <div className="flex flex-col gap-8">
      <ObserveBlock observe={observe} />

      {review.orient && <OrientBlock orient={review.orient} />}

      <OodaForm
        initial={{
          nextWeekRule:
            review.nextWeekRule ?? decisions.next_week_rule ?? "",
          reasoning: decisions.reasoning ?? "",
          usefulnessRating: usefulnessInitial,
          behaviourChangedRating: behaviourInitial,
        }}
      />

      {review.reportText && <ReportBlock text={review.reportText} />}

      <footer className="border-t border-neutral-200 pt-4 text-xs text-neutral-500 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Generated: {formatAestTimestamp(review.createdAt ?? new Date())}
        </span>
        <GenerateOodaButton regenerate />
      </footer>
    </div>
  );
}

function isUsefulness(v: string | null): v is UsefulnessRating {
  return v !== null && (USEFULNESS_OPTIONS as readonly string[]).includes(v);
}
function isBehaviour(v: string | null): v is BehaviourChangedRating {
  return v !== null && (BEHAVIOUR_OPTIONS as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Observe — PRD §12.8
// ---------------------------------------------------------------------------

function ObserveBlock({ observe: o }: { observe: ObservePayload }) {
  const fmtMoney = (n: number) =>
    n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  const fmtN = (n: number) => n.toLocaleString("en-AU");

  return (
    <section className="border border-black p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-3">
        Observe — week of {o.week_start} – {o.week_end}
      </h2>

      <div className="grid grid-cols-2 gap-y-1 text-sm font-mono">
        <span>CURRENT</span>
        <span className="text-right">
          ${fmtMoney(o.current_monthly_revenue)} {o.currency}/mo
        </span>
        <span>TARGET</span>
        <span className="text-right">
          ${fmtMoney(o.target_monthly_revenue)} {o.currency}/mo
        </span>
        <span className="font-bold">GAP</span>
        <span className="text-right font-bold">
          ${fmtMoney(o.gap)} {o.currency}/mo
        </span>
        <span>DAYS LEFT THIS MONTH</span>
        <span className="text-right">{o.days_left_in_month}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-y-1 text-sm">
        <Row label="Calls" value={fmtN(o.calls_this_week)} />
        <Row label="Follow-ups" value={fmtN(o.followups_this_week)} />
        <Row label="Offers/proposals" value={fmtN(o.offers_this_week)} />
        <Row
          label="One-off revenue"
          value={`$${fmtMoney(o.one_off_revenue_this_week)}`}
        />
        <Row
          label="Recurring revenue"
          value={`$${fmtMoney(o.recurring_revenue_this_week)}`}
        />
        <Row
          label="Training sessions"
          value={fmtN(o.training_completed)}
        />
        <Row
          label="Cold-call blocks"
          value={fmtN(o.cold_call_blocks_completed)}
        />
        <Row
          label="Client-delivery blocks"
          value={fmtN(o.client_delivery_blocks_completed)}
        />
        <Row
          label="Journals completed"
          value={`${o.journals_completed} / ${o.expected_journal_days}`}
        />
        <Row label="Skipped tasks" value={fmtN(o.skipped_tasks)} />
        <Row label="Deferred tasks" value={fmtN(o.deferred_tasks)} />
      </div>

      {o.standards_streaks.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1">
            Standards streaks
          </h3>
          <ul className="text-sm">
            {o.standards_streaks.map((s) => (
              <li key={s.key} className="flex justify-between">
                <span>{s.name}</span>
                <span className="font-mono">{s.streak} day(s)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {o.repeated_dodges.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-red-700 mb-1">
            Repeated dodges
          </h3>
          <ul className="text-sm list-disc list-inside text-neutral-800">
            {o.repeated_dodges.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {o.strongest_tale && (
        <div className="mt-4 border-l-4 border-emerald-700 pl-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-800 mb-1">
            Strongest tale — {o.strongest_tale.type} · {o.strongest_tale.date}
          </h3>
          <p className="text-sm text-neutral-800">
            {o.strongest_tale.summary}
          </p>
        </div>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span>{label}</span>
      <span className="text-right font-mono">{value}</span>
    </>
  );
}

// ---------------------------------------------------------------------------
// Orient + Report
// ---------------------------------------------------------------------------

function OrientBlock({ orient }: { orient: string }) {
  return (
    <section className="border-l-4 border-black pl-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
        Orient — what the pattern means
      </h2>
      <p className="mt-1 text-base leading-snug whitespace-pre-wrap">
        {orient}
      </p>
    </section>
  );
}

function ReportBlock({ text }: { text: string }) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-2">
        Weekly report
      </h2>
      <p className="text-sm leading-6 whitespace-pre-wrap text-neutral-800">
        {text}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Timestamp helper (matches /today)
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
