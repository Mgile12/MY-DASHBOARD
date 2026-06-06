import { NextResponse, type NextRequest } from "next/server";

// Edge-safe middleware. No NextAuth. No jose. Just checks for the
// presence of the signed session cookie set by /app/login/actions.ts.
// The cookie's signature is verified server-side in lib/auth-session.ts;
// here we only check presence, which is enough to gate route access.

const SESSION_COOKIE = "ms_session";

export function middleware(req: NextRequest) {
  // Always allow /login through, even when there's no session.
  if (req.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    if (req.nextUrl.pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except /login, /api/cron (cron has its own auth),
  // Next internals, and static assets.
  matcher: ["/((?!login|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
