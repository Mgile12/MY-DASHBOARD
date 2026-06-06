import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  verifySession,
  type SessionPayload,
} from "./session";

/**
 * Read + verify the session cookie. Returns the session payload, or null
 * if the cookie is missing, tampered with, expired, or for the wrong user.
 *
 * Also enforces the single-user allowlist: only ALLOWED_EMAIL passes.
 * This is the single source of truth for "is this user signed in?".
 */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySession(token);
  if (!session) return null;

  // Defence in depth: even if NEXTAUTH_SECRET were leaked and an
  // attacker forged a cookie, the email must match the allowlist.
  const allowed = process.env.ALLOWED_EMAIL;
  if (!allowed || session.email !== allowed) return null;

  return session;
}

/**
 * For Server Components: returns the session or redirects to /login.
 * Every page that requires auth should call this at the top.
 *
 * Since we no longer use middleware (Vercel Edge runtime was crashing),
 * this is the only auth gate for pages.
 */
export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

/**
 * For Server Actions: returns the email or throws.
 * Server Actions can't redirect — they return a result.
 */
export async function requireEmail(): Promise<string> {
  const s = await getSession();
  if (!s) throw new Error("Not signed in");
  return s.email;
}
