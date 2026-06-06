import { createHmac, timingSafeEqual } from "node:crypto";

// Signed-cookie session for the single-user app. No NextAuth, no jose,
// no @auth/core. Just an HMAC-SHA256 signed token in a cookie.
//
// Format: <base64url(payload)>.<hex(hmac-sha256(secret, base64url(payload)))>
// Payload: { email: string, iat: number, exp: number } as JSON.

const COOKIE_NAME = "ms_session";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  email: string;
  iat: number; // issued-at, seconds since epoch
  exp: number; // expiry, seconds since epoch
};

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "NEXTAUTH_SECRET is not set (or too short). Cannot sign sessions.",
    );
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(str: string): string {
  // Pad back to multiple of 4 if needed.
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

function hmac(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/**
 * Build a signed session token for a given email.
 * Default TTL = 30 days.
 */
export function signSession(
  email: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    email,
    iat: now,
    exp: now + ttlSeconds,
  };
  const encoded = base64url(JSON.stringify(payload));
  const sig = hmac(encoded);
  return `${encoded}.${sig}`;
}

/**
 * Verify a token, return its payload, or null if invalid/expired.
 * Uses timing-safe comparison on the HMAC.
 */
export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const idx = token.indexOf(".");
  if (idx === -1) return null;

  const encoded = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = hmac(encoded);

  // Constant-time compare to avoid leaking signature info via timing.
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  let parsed: SessionPayload;
  try {
    parsed = JSON.parse(fromBase64url(encoded));
  } catch {
    return null;
  }

  if (
    typeof parsed?.email !== "string" ||
    typeof parsed?.exp !== "number" ||
    typeof parsed?.iat !== "number"
  ) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.exp < now) return null;

  return parsed;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_TTL_SECONDS = DEFAULT_TTL_SECONDS;
