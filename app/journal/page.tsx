import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-session";
import { db } from "@/db";
import { journalEntries, type JournalEntry } from "@/db/schema";
import { aestToday, aestDayOfWeek, isAestSunday } from "@/lib/date";
import { JournalForm } from "./form";
import {
  Card,
  PageHeader,
  PageShell,
  Pill,
  Section,
} from "@/app/_components/ui";

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
  const { email } = await requireSession();
  const today = aestToday();
  const dow = aestDayOfWeek();
  const isSunday = isAestSunday();

  const recent = await getRecentEntries(email);
  const todayEntry = isSunday ? null : await getTodayEntry(email, today);

  return (
    <PageShell>
      <PageHeader
        title="Nightly journal"
        subtitle={`${email} · today ${today} AEST`}
        current="journal"
      />

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
    </PageShell>
  );
}

function SundayPlaceholder() {
  return (
    <Card>
      <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-neutral-400">
        Sunday
      </div>
      <p className="mt-2 text-[16px] font-semibold text-neutral-50">
        No journal today.
      </p>
      <p className="mt-2 text-[14px] text-neutral-400 leading-relaxed">
        Per PRD §10.3, the{" "}
        <Link
          href="/weekly"
          className="underline decoration-neutral-500 underline-offset-4 hover:text-neutral-200"
        >
          Sunday OODA Loop
        </Link>{" "}
        replaces the nightly journal. Do that tonight. Browse recent entries
        below if you want a reflection on the week.
      </p>
    </Card>
  );
}

function RecentEntries({
  entries,
  todayDate,
}: {
  entries: JournalEntry[];
  todayDate: string;
}) {
  return (
    <div className="mt-12">
      <Section label={`Recent journals${entries.length > 0 ? ` · last ${entries.length}` : ""}`}>
        {entries.length === 0 ? (
          <Card>
            <p className="text-[14px] text-neutral-500">No journals yet.</p>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-neutral-800">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="tabular-nums text-[13px] font-semibold text-neutral-50">
                      {e.date}
                    </span>
                    {e.date === todayDate && (
                      <Pill variant="do">Today</Pill>
                    )}
                    {e.taleType && (
                      <Pill variant="neutral">{e.taleType}</Pill>
                    )}
                  </div>
                  <span className="text-[12px] text-neutral-500 tabular-nums shrink-0">
                    {e.callsMade ?? 0} calls · {e.followupsCompleted ?? 0} f/u ·{" "}
                    {e.offersSent ?? 0} offers
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Section>
    </div>
  );
}
