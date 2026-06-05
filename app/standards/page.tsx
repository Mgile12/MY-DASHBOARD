import Link from "next/link";
import { auth } from "@/auth";
import {
  getStandardsWithStreaks,
  seedDefaultStandards,
} from "@/lib/standards";
import { ActiveToggle } from "./toggle";

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
    set.has("mon") &&
    set.has("tue") &&
    set.has("wed") &&
    set.has("thu") &&
    set.has("fri") &&
    set.has("sat") &&
    set.has("sun")
  )
    return "Every day";
  if (
    set.has("mon") &&
    set.has("tue") &&
    set.has("wed") &&
    set.has("thu") &&
    set.has("fri") &&
    !set.has("sat") &&
    !set.has("sun")
  )
    return "Mon–Fri";
  if (
    set.has("mon") &&
    set.has("tue") &&
    set.has("wed") &&
    set.has("thu") &&
    set.has("fri") &&
    set.has("sat") &&
    !set.has("sun")
  )
    return "Mon–Sat";
  return activeDays
    .map((d) => DAY_LABEL[d] ?? d)
    .join(", ");
}

export default async function StandardsPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return <main className="p-8">Not signed in.</main>;

  // Idempotent — seeds the 5 default standards on first visit.
  await seedDefaultStandards(email);
  const stds = await getStandardsWithStreaks(email);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <Header email={email} />
      <p className="text-sm text-neutral-600 mb-6">
        Streaks count only on active days. Inactive days are skipped — they
        don&apos;t break the streak. Cold-call streaks don&apos;t break on
        weekends.
      </p>
      <ul className="flex flex-col gap-3">
        {stds.map((s) => (
          <li
            key={s.id}
            className="border border-neutral-200 rounded p-4 flex flex-col gap-2"
          >
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-semibold">{s.name}</h2>
                {s.description && (
                  <p className="text-sm text-neutral-600">{s.description}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs uppercase tracking-widest text-neutral-500">
                  Streak
                </div>
                <div className="font-mono text-lg font-semibold">
                  {s.streak}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-100">
              <span className="text-xs text-neutral-500">
                Active days: {daysSummary(s.activeDays)}
              </span>
              <ActiveToggle standardId={s.id} initialActive={s.active} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

function Header({ email }: { email: string }) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Standards</h1>
        <p className="text-sm text-neutral-500">{email}</p>
      </div>
      <nav className="flex items-center gap-5 text-sm">
        <Link href="/today" className="text-neutral-700 hover:underline">
          Today
        </Link>
        <Link href="/journal" className="text-neutral-700 hover:underline">
          Journal
        </Link>
        <Link href="/weekly" className="text-neutral-700 hover:underline">
          Weekly
        </Link>
        <Link href="/settings" className="text-neutral-700 hover:underline">
          Settings
        </Link>
      </nav>
    </header>
  );
}
