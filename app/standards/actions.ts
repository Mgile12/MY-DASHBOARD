"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-session";
import { db } from "@/db";
import { standards } from "@/db/schema";

export type StandardActionResult = { ok: true } | { ok: false; error: string };

async function ownedStandard(standardId: string, email: string) {
  const rows = await db
    .select({ id: standards.id, userId: standards.userId })
    .from(standards)
    .where(eq(standards.id, standardId))
    .limit(1);
  const r = rows[0];
  if (!r || r.userId !== email) return null;
  return r;
}

export async function toggleStandardAction(
  standardId: string,
  nextActive: boolean,
): Promise<StandardActionResult> {
  const session = await getSession();
  const email = session?.email;
  if (!email) return { ok: false, error: "Not signed in" };
  const owned = await ownedStandard(standardId, email);
  if (!owned) return { ok: false, error: "Standard not found" };

  await db
    .update(standards)
    .set({ active: nextActive })
    .where(and(eq(standards.id, standardId), eq(standards.userId, email)));
  revalidatePath("/standards");
  return { ok: true };
}
