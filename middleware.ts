import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Instantiate NextAuth from the Edge-safe config only — importing
// `@/auth` here would pull DB / Node-only deps into the Edge bundle and
// fail the Vercel deploy.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // If unauthenticated and not already on the sign-in flow, redirect.
  if (!req.auth && !req.nextUrl.pathname.startsWith("/api/auth")) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  // Run middleware on Node.js runtime (Next 15.2+ experimental).
  // Required because NextAuth v5's auth core uses __dirname and other
  // Node-only globals that the Vercel Edge runtime doesn't expose.
  runtime: "nodejs",
  // Protect everything except /api/auth/*, Next internals, static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
