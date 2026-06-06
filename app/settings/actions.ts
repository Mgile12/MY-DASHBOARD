"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { getSession } from "@/lib/auth-session";

const settingsSchema = z.object({
  currentMonthlyRevenue: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v))
    .refine(
      (v) => v === null || /^-?\d+(\.\d+)?$/.test(v),
      "must be a number"
    ),
  targetMonthlyRevenue: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v))
    .refine(
      (v) => v === null || /^-?\d+(\.\d+)?$/.test(v),
      "must be a number"
    ),
  currency: z.string().trim().min(1).max(8),
  systemPrompt: z.string(),
  villainDescription: z.string(),
  weekdayBriefTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "must be HH:MM"),
  saturdayBriefTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "must be HH:MM"),
});

export type SettingsActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveSettings(
  formData: FormData
): Promise<SettingsActionResult> {
  const session = await getSession();
  const email = session?.email;
  if (!email) return { ok: false, error: "Not signed in" };

  const raw = {
    currentMonthlyRevenue: formData.get("currentMonthlyRevenue")?.toString() ?? "",
    targetMonthlyRevenue: formData.get("targetMonthlyRevenue")?.toString() ?? "",
    currency: formData.get("currency")?.toString() ?? "AUD",
    systemPrompt: formData.get("systemPrompt")?.toString() ?? "",
    villainDescription: formData.get("villainDescription")?.toString() ?? "",
    weekdayBriefTime: formData.get("weekdayBriefTime")?.toString() ?? "04:00",
    saturdayBriefTime: formData.get("saturdayBriefTime")?.toString() ?? "07:00",
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: `${first.path.join(".")}: ${first.message}` };
  }

  const values = parsed.data;
  try {
    await db
      .insert(userSettings)
      .values({
        userId: email,
        currentMonthlyRevenue: values.currentMonthlyRevenue,
        targetMonthlyRevenue: values.targetMonthlyRevenue,
        currency: values.currency,
        systemPrompt: values.systemPrompt,
        villainDescription: values.villainDescription,
        weekdayBriefTime: values.weekdayBriefTime,
        saturdayBriefTime: values.saturdayBriefTime,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          currentMonthlyRevenue: values.currentMonthlyRevenue,
          targetMonthlyRevenue: values.targetMonthlyRevenue,
          currency: values.currency,
          systemPrompt: values.systemPrompt,
          villainDescription: values.villainDescription,
          weekdayBriefTime: values.weekdayBriefTime,
          saturdayBriefTime: values.saturdayBriefTime,
          updatedAt: new Date(),
        },
      });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Database error",
    };
  }

  revalidatePath("/settings");
  return { ok: true };
}
