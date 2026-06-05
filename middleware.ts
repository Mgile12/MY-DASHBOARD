import { auth } from "@/auth";

export default auth((req) => {
  // If unauthenticated and not already on the sign-in flow, redirect.
  if (!req.auth && !req.nextUrl.pathname.startsWith("/api/auth")) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  // Protect everything except /api/auth/* and Next internals/static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
