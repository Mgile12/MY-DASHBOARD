import { cookies } from "next/headers";
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
 * Convenience for Server Actions: returns the email or throws.
 * Use this only after you've already redirected unauthenticated users
 * (middleware does that for page navigations). For routes that must
 * never run without a session, throwing is fine — it bubbles up to a 500.
 */
export async function requireEmail(): Promise<string> {
  const s = await getSession();
  if (!s) throw new Error("Not signed in");
  return s.email;
}
