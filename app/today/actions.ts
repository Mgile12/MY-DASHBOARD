"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { generateBriefForToday, type GenerateResult } from "@/lib/brief";

export async function generateBriefAction(): Promise<GenerateResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Not signed in" };

  const result = await generateBriefForToday(email);
  if (result.ok) revalidatePath("/today");
  return result;
}
