"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signSession,
} from "@/lib/session";

export type LoginResult = { ok: true } | { ok: false; error: string };

// Constant-time string compare so wrong passwords don't leak timing info.
function safeStrEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Use timingSafeEqual on equal-length pads to still consume similar time.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const allowedEmail = (process.env.ALLOWED_EMAIL ?? "").trim().toLowerCase();
  const appPassword = process.env.APP_PASSWORD ?? "";

  if (!allowedEmail || !appPassword) {
    return {
      ok: false,
      error: "Server not configured: ALLOWED_EMAIL or APP_PASSWORD missing.",
    };
  }

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const emailOk = safeStrEqual(email, allowedEmail);
  const passOk = safeStrEqual(password, appPassword);

  // Always run both checks (no short-circuit) so timing doesn't leak which
  // field was wrong.
  if (!emailOk || !passOk) {
    return { ok: false, error: "Wrong email or password." };
  }

  // Sign + set the cookie.
  const token = signSession(allowedEmail);
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
