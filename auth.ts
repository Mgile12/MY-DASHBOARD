import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Full NextAuth instance. Used by /api/auth/[...nextauth] route, Server
// Components, and Server Actions. The middleware imports authConfig
// directly (see middleware.ts) to keep its bundle Edge-compatible.
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
