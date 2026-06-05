import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { journalEntries, type JournalEntry } from "@/db/schema";
import { aestToday, aestDayOfWeek, isAestSunday } from "@/lib/date";
import { JournalForm } from "./form";

export const dynamic = "force-dynamic";

async function getTodayEntry(
  email: string,
  date: string,
): Promise<JournalEntry | null> {
  const rows = await db
    .select()
    .from(journalEntries)
    .where(
      and(eq(journalEntries.userId, email), eq(journalEntries.date, date)),
    )
    .limit(1);
  return rows[0] ?? null;
}

async function getRecentEntries(email: string): Promise<JournalEntry[]> {
  return await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, email))
    .orderBy(desc(journalEntries.date))
    .limit(7);
}

export default async function JournalPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return <main className="p-8">Not signed in.</main>;

  const today = aestToday();
  const dow = aestDayOfWeek();
  const isSunday = isAestSunday();

  const recent = await getRecentEntries(email);
  const todayEntry = isSunday ? null : await getTodayEntry(email, today);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <Header email={email} today={today} />

      {isSunday ? (
        <SundayPlaceholder />
      ) : (
        <JournalForm
          dayOfWeek={dow}
          initial={{
            moneyMoved: todayEntry?.moneyMoved ?? "",
            callsMade: String(todayEntry?.callsMade ?? ""),
            followupsCompleted: String(todayEntry?.followupsCompleted ?? ""),
            followupsNotes: todayEntry?.followupsNotes ?? "",
            offersSent: String(todayEntry?.offersSent ?? ""),
            oneOffRevenueWon: todayEntry?.oneOffRevenueWon ?? "",
            recurringRevenueWon: todayEntry?.recurringRevenueWon ?? "",
            dodged: todayEntry?.dodged ?? "",
            reactivePulls: todayEntry?.reactivePulls ?? "",
            tomorrowMust: todayEntry?.tomorrowMust ?? "",
            clientDeliveryCompleted: todayEntry?.clientDeliveryCompleted ?? false,
            clientDeliveryNotes: todayEntry?.clientDeliveryNotes ?? "",
            trainingCompleted: todayEntry?.trainingCompleted ?? false,
            coldCallingCompleted: todayEntry?.coldCallingCompleted ?? false,
            taleType: (todayEntry?.taleType ?? "") as
              | ""
              | "victory"
              | "adventure"
              | "thankfulness"
              | "empowerment",
          }}
        />
      )}

      <RecentEntries entries={recent} todayDate={today} />
    </main>
  );
}

function Header({ email, today }: { email: string; today: string }) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Nightly journal</h1>
        <p className="text-sm text-neutral-500">
          {email} · today (AEST): {today}
        </p>
      </div>
      <nav className="flex items-center gap-5 text-sm">
        <Link href="/today" className="text-neutral-700 hover:underline">
          Today
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
      <p className="font-semibold">Sunday — no journal today.</p>
      <p className="mt-1 text-neutral-600">
        Per PRD §10.3, Sunday OODA replaces the nightly journal. The OODA
        review screen lands in Step 7 of the build. Until then, Sunday is
        rest. Browse recent entries below if you want a reflection on the
        week.
      </p>
    </div>
  );
}

function RecentEntries({
  entries,
  todayDate,
}: {
  entries: JournalEntry[];
  todayDate: string;
}) {
  if (entries.length === 0) {
    return (
      <section className="mt-12 border-t border-neutral-200 pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
          Recent
        </h2>
        <p className="mt-2 text-sm text-neutral-500">No journals yet.</p>
      </section>
    );
  }

  return (
    <section className="mt-12 border-t border-neutral-200 pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 mb-3">
        Recent journals (last {entries.length})
      </h2>
      <ul className="flex flex-col gap-2 text-sm">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-baseline justify-between border-b border-neutral-100 pb-2"
          >
            <span className="font-mono text-xs">
              {e.date}
              {e.date === todayDate && (
                <span className="ml-2 text-green-700">· today</span>
              )}
            </span>
            <span className="text-neutral-600 text-xs">
              {e.callsMade ?? 0} calls · {e.followupsCompleted ?? 0} f/u ·{" "}
              {e.offersSent ?? 0} offers
              {e.taleType && (
                <span className="ml-2 text-neutral-900 uppercase">
                  · {e.taleType}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
