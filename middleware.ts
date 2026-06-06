import { NextResponse, type NextRequest } from "next/server";

// Edge-safe middleware: no NextAuth import, no jose, no Node-only deps.
// We just check for the presence of the NextAuth session cookie. Full
// JWT validation happens in the page / route handler via `auth()` from
// auth.ts, which runs in the Node serverless runtime.
//
// Trade-off: a fake/expired cookie will pass middleware but get rejected
// server-side. Pages already defensively handle a missing session
// (`if (!email) return <Not signed in />`), so this is safe.

const SESSION_COOKIES = [
  // NextAuth v5 default cookie names.
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function middleware(req: NextRequest) {
  // Always allow /api/auth/* (the matcher already excludes it, but be defensive).
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const hasSession = SESSION_COOKIES.some((name) =>
    req.cookies.has(name),
  );

  if (!hasSession) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except /api/auth/*, Next internals, and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
