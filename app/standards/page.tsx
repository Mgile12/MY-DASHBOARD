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
          <div key={s.id} className="rounded-2xl bg-neutral-900 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold text-neutral-50">
                  {s.name}
                </h2>
                {s.description && (
                  <p className="text-[13px] text-neutral-400 mt-1 leading-snug">
                    {s.description}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-500">
                  Streak
                </div>
                <div
                  className={`text-3xl font-extrabold tabular-nums leading-none mt-1 ${
                    s.streak > 0 ? "text-green-400" : "text-neutral-600"
                  }`}
                >
                  {s.streak}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-neutral-800">
              <Pill variant="neutral">
                {daysSummary(s.activeDays)}
              </Pill>
              <ActiveToggle standardId={s.id} initialActive={s.active} />
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
