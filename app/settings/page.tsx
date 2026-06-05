import Link from "next/link";
import { promises as fs } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { userSettings, type UserSettings } from "@/db/schema";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/default-system-prompt";
import { seedDefaultStandards } from "@/lib/standards";
import { SettingsForm } from "./form";

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
    // Defensive — also seed default standards for users who signed up
    // before standards existed. Idempotent.
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

  // Seed default standards alongside user_settings.
  await seedDefaultStandards(email);

  return inserted[0];
}

export default async function SettingsPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    // middleware should have redirected; defensive fallback
    return <main className="p-8">Not signed in.</main>;
  }

  const row = await getOrCreateSettings(email);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-neutral-500">Signed in as {email}</p>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/today" className="text-neutral-700 hover:underline">
            Today
          </Link>
          <Link
            href="/journal"
            className="text-neutral-700 hover:underline"
          >
            Journal
          </Link>
          <Link
            href="/standards"
            className="text-neutral-700 hover:underline"
          >
            Standards
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/api/auth/signin" });
            }}
          >
            <button
              type="submit"
              className="text-neutral-600 hover:underline"
            >
              Sign out
            </button>
          </form>
        </nav>
      </header>

      <SettingsForm
        initial={{
          currentMonthlyRevenue: row.currentMonthlyRevenue ?? "",
          targetMonthlyRevenue: row.targetMonthlyRevenue ?? "",
          currency: row.currency ?? "AUD",
          // Fall back to the default if the user's stored prompt is empty
          // (covers users created before this column was seeded).
          systemPrompt: row.systemPrompt?.trim()
            ? row.systemPrompt
            : DEFAULT_SYSTEM_PROMPT,
          villainDescription: row.villainDescription ?? "",
          weekdayBriefTime: (row.weekdayBriefTime ?? "04:00").slice(0, 5),
          saturdayBriefTime: (row.saturdayBriefTime ?? "07:00").slice(0, 5),
          telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
        }}
      />
    </main>
  );
}
