import { requireSession } from "@/lib/auth-session";
import { aestToday } from "@/lib/date";
import {
  currentWeekStart,
  currentWeekEnd,
  getCurrentWeekReview,
  type ObservePayload,
} from "@/lib/weekly";
import { GenerateOodaButton } from "./generate-button";
import { OodaForm } from "./form";
import { ReflectionForm } from "./reflection-form";
import {
  BEHAVIOUR_OPTIONS,
  REFLECTION_QUESTIONS,
  USEFULNESS_OPTIONS,
  type BehaviourChangedRating,
  type Reflections,
  type UsefulnessRating,
} from "./labels";
import {
  Card,
  FooterMeta,
  HeroStat,
  PageHeader,
  PageShell,
  Section,
  StatBlock,
  StatGrid,
} from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export default async function WeeklyPage() {
  const { email } = await requireSession();
  const today = aestToday();
  const weekStart = currentWeekStart();
  const weekEnd = currentWeekEnd();
  const review = await getCurrentWeekReview(email);

  return (
    <PageShell>
      <PageHeader
        title="Sunday OODA Loop"
        subtitle={`${email} · week of ${weekStart} – ${weekEnd} · today ${today} AEST`}
        current="weekly"
      />
      {review === null ? <EmptyState /> : <ReviewView review={review} />}
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Empty state — user answers the six prompts, those drive AI generation
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-neutral-400">
          No OODA Loop this week yet
        </div>
        <p className="mt-2 text-[14px] text-neutral-300 leading-relaxed">
          Answer the six prompts below. Your answers go to Claude alongside
          this week&apos;s journals, briefs, and sales numbers. Claude
          cross-references what you <em>think</em> happened against the
          receipts and produces Orient (the pattern) + Decide (next
          week&apos;s rule) + a weekly report.
        </p>
      </Card>
      <ReflectionForm />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review view
// ---------------------------------------------------------------------------

type DecisionsJson = { next_week_rule?: string; reasoning?: string };

function ReviewView({
  review,
}: {
  review: NonNullable<Awaited<ReturnType<typeof getCurrentWeekReview>>>;
}) {
  const observe = review.observe as unknown as ObservePayload;
  const decisions = (review.decisions ?? {}) as DecisionsJson;
  const reflections = (review.reflections ?? {}) as Reflections;

  const usefulnessInitial = isUsefulness(review.usefulnessRating)
    ? review.usefulnessRating
    : "";
  const behaviourInitial = isBehaviour(review.behaviourChangedRating)
    ? review.behaviourChangedRating
    : "";

  return (
    <div className="space-y-8">
      <ObserveBlock observe={observe} />

      <ReflectionsBlock reflections={reflections} />

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

      <FooterMeta
        left={
          <span>
            Generated{" "}
            {formatAestTimestamp(review.createdAt ?? new Date())}
          </span>
        }
        right={<GenerateOodaButton regenerate />}
      />

      <EditReflectionsBlock reflections={reflections} />
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
// Reflections block (read-only display + edit pane)
// ---------------------------------------------------------------------------

function ReflectionsBlock({ reflections }: { reflections: Reflections }) {
  const hasAny = REFLECTION_QUESTIONS.some(
    (q) => (reflections[q.key] ?? "").trim().length > 0,
  );
  if (!hasAny) return null;

  return (
    <Section label="Your reflections">
      <Card>
        <dl className="space-y-4">
          {REFLECTION_QUESTIONS.map((q) => {
            const v = (reflections[q.key] ?? "").trim();
            if (!v) return null;
            return (
              <div key={q.key} className="space-y-1">
                <dt className="text-[11px] font-semibold tracking-[0.12em] uppercase text-neutral-500">
                  {q.label}
                </dt>
                <dd className="text-[14px] text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {v}
                </dd>
              </div>
            );
          })}
        </dl>
      </Card>
    </Section>
  );
}

function EditReflectionsBlock({ reflections }: { reflections: Reflections }) {
  return (
    <details className="rounded-2xl bg-neutral-900 p-5">
      <summary className="cursor-pointer text-[14px] font-semibold text-neutral-200 hover:text-neutral-50 transition-colors">
        Edit reflections and regenerate
      </summary>
      <p className="text-[12px] text-neutral-500 mt-2 mb-4 leading-relaxed">
        Tweaking your reflections and submitting will overwrite this
        week&apos;s OODA Loop with a fresh generation.
      </p>
      <ReflectionForm
        initial={reflections}
        submitLabel="Regenerate with edited reflections"
      />
    </details>
  );
}

// ---------------------------------------------------------------------------
// Observe — stat-card scoreboard, matching /today's design
// ---------------------------------------------------------------------------

function ObserveBlock({ observe: o }: { observe: ObservePayload }) {
  const fmtMoney = (n: number) =>
    n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  const fmtN = (n: number) => n.toLocaleString("en-AU");

  return (
    <Section label={`Observe · ${o.week_start} – ${o.week_end}`}>
      <HeroStat
        label={`Gap · ${o.currency}/mo`}
        value={`$${fmtMoney(o.gap)}`}
        sub={`${o.days_left_in_month} days left this month`}
      />
      <StatGrid>
        <StatBlock
          label="Current"
          value={`$${fmtMoney(o.current_monthly_revenue)}`}
          delta={`${o.currency}/mo`}
        />
        <StatBlock
          label="Target"
          value={`$${fmtMoney(o.target_monthly_revenue)}`}
          delta={`${o.currency}/mo`}
        />
      </StatGrid>

      <Card>
        <div className="space-y-3 text-[14px]">
          <Row label="Calls" value={fmtN(o.calls_this_week)} />
          <Row
            label="Follow-ups"
            value={fmtN(o.followups_this_week)}
            tone={o.followups_this_week > 0 ? "win" : "neutral"}
          />
          <Row
            label="Offers / proposals"
            value={fmtN(o.offers_this_week)}
            tone={o.offers_this_week > 0 ? "win" : "neutral"}
          />
          <Row
            label="One-off revenue"
            value={`$${fmtMoney(o.one_off_revenue_this_week)}`}
            tone={o.one_off_revenue_this_week > 0 ? "win" : "neutral"}
          />
          <Row
            label="Recurring revenue"
            value={`$${fmtMoney(o.recurring_revenue_this_week)}`}
            tone={o.recurring_revenue_this_week > 0 ? "win" : "neutral"}
          />
          <div className="h-px bg-neutral-800" />
          <Row
            label="Training"
            value={fmtN(o.training_completed)}
            tone={o.training_completed > 0 ? "win" : "neutral"}
          />
          <Row
            label="Cold-call blocks"
            value={fmtN(o.cold_call_blocks_completed)}
            tone={o.cold_call_blocks_completed > 0 ? "win" : "neutral"}
          />
          <Row
            label="Client-delivery blocks"
            value={fmtN(o.client_delivery_blocks_completed)}
          />
          <div className="h-px bg-neutral-800" />
          <Row
            label="Journals completed"
            value={`${o.journals_completed} / ${o.expected_journal_days}`}
            tone={
              o.expected_journal_days > 0 &&
              o.journals_completed === o.expected_journal_days
                ? "win"
                : o.journals_completed < o.expected_journal_days
                  ? "danger"
                  : "neutral"
            }
          />
          <Row
            label="Skipped tasks"
            value={fmtN(o.skipped_tasks)}
            tone={o.skipped_tasks > 0 ? "danger" : "neutral"}
          />
          <Row
            label="Deferred tasks"
            value={fmtN(o.deferred_tasks)}
            tone={o.deferred_tasks > 0 ? "danger" : "neutral"}
          />
        </div>
      </Card>

      {o.standards_streaks.length > 0 && (
        <Card>
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-500 mb-3">
            Standards streaks
          </div>
          <ul className="space-y-2 text-[14px]">
            {o.standards_streaks.map((s) => (
              <li key={s.key} className="flex items-center justify-between">
                <span className="text-neutral-200">{s.name}</span>
                <span
                  className={`tabular-nums font-bold text-[16px] ${
                    s.streak > 0 ? "text-green-400" : "text-neutral-600"
                  }`}
                >
                  {s.streak}{" "}
                  <span className="text-[11px] font-normal text-neutral-500 uppercase tracking-widest">
                    day{s.streak === 1 ? "" : "s"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {o.repeated_dodges.length > 0 && (
        <div className="rounded-2xl bg-red-500/10 ring-1 ring-red-500/30 p-5">
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-red-400 mb-2">
            Repeated dodges
          </div>
          <ul className="space-y-1.5 text-[14px] text-red-100">
            {o.repeated_dodges.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-red-500/60">·</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {o.strongest_tale && (
        <div className="rounded-2xl bg-green-500/10 ring-1 ring-green-500/30 p-5">
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-green-400 mb-2">
            Strongest tale · {o.strongest_tale.type} · {o.strongest_tale.date}
          </div>
          <p className="text-[14px] text-green-50 leading-relaxed">
            {o.strongest_tale.summary}
          </p>
        </div>
      )}
    </Section>
  );
}

function Row({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "win" | "danger";
}) {
  const numColor =
    tone === "win"
      ? "text-green-400"
      : tone === "danger"
        ? "text-red-400"
        : "text-neutral-50";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-neutral-300">{label}</span>
      <span className={`tabular-nums font-bold text-[16px] ${numColor}`}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Orient + Report
// ---------------------------------------------------------------------------

function OrientBlock({ orient }: { orient: string }) {
  return (
    <Section label="Orient — what the pattern means">
      <Card>
        <p className="text-[16px] leading-relaxed whitespace-pre-wrap text-neutral-100">
          {orient}
        </p>
      </Card>
    </Section>
  );
}

function ReportBlock({ text }: { text: string }) {
  return (
    <Section label="Weekly report">
      <Card>
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-neutral-300">
          {text}
        </p>
      </Card>
    </Section>
  );
}

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
