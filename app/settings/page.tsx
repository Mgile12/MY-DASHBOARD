import { promises as fs } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-session";
import { logoutAction } from "@/app/login/actions";
import { db } from "@/db";
import { userSettings, type UserSettings } from "@/db/schema";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/default-system-prompt";
import { seedDefaultStandards } from "@/lib/standards";
import { SettingsForm } from "./form";
import { PageHeader, PageShell } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

async function loadVillainSeed(): Promise<string> {
  try {
    const p = path.join(process.cwd(), "VILLAIN.md");
    return await fs.readFile(p, "utf8");
  } catch {
    return "";
  }
}

async function getOrCreateSettings(email: string): Promise<UserSettings> {
  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, email))
    .limit(1);

  if (existing[0]) {
    await seedDefaultStandards(email);
    return existing[0];
  }

  const villainSeed = await loadVillainSeed();
  const inserted = await db
    .insert(userSettings)
    .values({
      userId: email,
      currency: "AUD",
      villainDescription: villainSeed,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      weekdayBriefTime: "04:00",
      saturdayBriefTime: "07:00",
    })
    .returning();

  await seedDefaultStandards(email);
  return inserted[0];
}

export default async function SettingsPage() {
  const { email } = await requireSession();
  const row = await getOrCreateSettings(email);

  return (
    <PageShell>
      <PageHeader
        title="Settings"
        subtitle={`Signed in as ${email}`}
        current="settings"
      />

      <SettingsForm
        initial={{
          currentMonthlyRevenue: row.currentMonthlyRevenue ?? "",
          targetMonthlyRevenue: row.targetMonthlyRevenue ?? "",
          currency: row.currency ?? "AUD",
          systemPrompt: row.systemPrompt?.trim()
            ? row.systemPrompt
            : DEFAULT_SYSTEM_PROMPT,
          villainDescription: row.villainDescription ?? "",
          weekdayBriefTime: (row.weekdayBriefTime ?? "04:00").slice(0, 5),
          saturdayBriefTime: (row.saturdayBriefTime ?? "07:00").slice(0, 5),
          telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
        }}
      />

      <form className="mt-10 border-t border-neutral-900 pt-6" action={logoutAction}>
        <button
          type="submit"
          className="text-[12px] uppercase tracking-[0.14em] text-neutral-500 hover:text-neutral-200 transition-colors"
        >
          Sign out
        </button>
      </form>
    </PageShell>
  );
}
