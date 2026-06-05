import { promises as fs } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { userSettings, type UserSettings } from "@/db/schema";
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

  if (existing[0]) return existing[0];

  const villainSeed = await loadVillainSeed();
  const inserted = await db
    .insert(userSettings)
    .values({
      userId: email,
      currency: "AUD",
      villainDescription: villainSeed,
      systemPrompt: "",
      weekdayBriefTime: "04:00",
      saturdayBriefTime: "07:00",
    })
    .returning();

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
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/api/auth/signin" });
          }}
        >
          <button
            type="submit"
            className="text-sm text-neutral-600 hover:underline"
          >
            Sign out
          </button>
        </form>
      </header>

      <SettingsForm
        initial={{
          currentMonthlyRevenue: row.currentMonthlyRevenue ?? "",
          targetMonthlyRevenue: row.targetMonthlyRevenue ?? "",
          currency: row.currency ?? "AUD",
          systemPrompt: row.systemPrompt ?? "",
          villainDescription: row.villainDescription ?? "",
          weekdayBriefTime: (row.weekdayBriefTime ?? "04:00").slice(0, 5),
          saturdayBriefTime: (row.saturdayBriefTime ?? "07:00").slice(0, 5),
          telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
        }}
      />
    </main>
  );
}
