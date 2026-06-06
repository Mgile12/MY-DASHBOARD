import { requireSession } from "@/lib/auth-session";
import {
  getStandardsWithStreaks,
  seedDefaultStandards,
} from "@/lib/standards";
import { ActiveToggle } from "./toggle";
import {
  Card,
  PageHeader,
  PageShell,
  Pill,
  Section,
} from "@/app/_components/ui";

export const dynamic = "force-dynamic";

const DAY_LABEL: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function daysSummary(activeDays: string[] | null): string {
  if (!activeDays || activeDays.length === 0) return "Never";
  const set = new Set(activeDays);
  if (
    set.has("mon") && set.has("tue") && set.has("wed") &&
    set.has("thu") && set.has("fri") && set.has("sat") && set.has("sun")
  )
    return "Every day";
  if (
    set.has("mon") && set.has("tue") && set.has("wed") &&
    set.has("thu") && set.has("fri") && !set.has("sat") && !set.has("sun")
  )
    return "Mon–Fri";
  if (
    set.has("mon") && set.has("tue") && set.has("wed") &&
    set.has("thu") && set.has("fri") && set.has("sat") && !set.has("sun")
  )
    return "Mon–Sat";
  return activeDays.map((d) => DAY_LABEL[d] ?? d).join(", ");
}

export default async function StandardsPage() {
  const { email } = await requireSession();

  // Idempotent — seeds the 5 default standards on first visit.
  await seedDefaultStandards(email);
  const stds = await getStandardsWithStreaks(email);

  return (
    <PageShell>
      <PageHeader
        title="Standards"
        subtitle={email}
        current="standards"
      />

      <Section label="How streaks work">
        <Card>
          <p className="text-[13px] text-neutral-400 leading-relaxed">
            Streaks count only on active days. Inactive days are skipped — they
            don&apos;t break the streak. Cold-call streaks don&apos;t break on
            weekends.
          </p>
        </Card>
      </Section>

      <div className="mt-6 space-y-3">
        {stds.map((s) => (
          <div
            key={s.id}
            className={`rounded-2xl bg-neutral-900 p-5 transition-opacity duration-200 ${
              s.active ? "" : "opacity-60"
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Big streak number — leaderboard left column */}
              <div className="shrink-0 text-center">
                <div
                  className={`text-[48px] sm:text-[56px] font-extrabold tabular-nums leading-[0.85] ${
                    s.streak > 0 ? "text-green-400" : "text-neutral-700"
                  }`}
                >
                  {s.streak}
                </div>
                <div className="mt-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-neutral-500">
                  {s.streak === 1 ? "day" : "days"}
                </div>
              </div>

              {/* Name + description + active-days + toggle */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[16px] font-semibold text-neutral-50 leading-snug">
                    {s.name}
                  </h2>
                  <ActiveToggle standardId={s.id} initialActive={s.active} />
                </div>
                {s.description && (
                  <p className="text-[13px] text-neutral-400 mt-1.5 leading-snug">
                    {s.description}
                  </p>
                )}
                <div className="mt-3">
                  <Pill variant="neutral">{daysSummary(s.activeDays)}</Pill>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
