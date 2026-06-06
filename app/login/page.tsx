import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth-session";
import { LoginForm } from "./form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in? Skip the login.
  const session = await getSession();
  if (session) redirect("/today");

  return (
    <main className="mx-auto max-w-[440px] px-5 sm:px-6 pt-20 pb-12">
      <div className="mb-10">
        <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-neutral-500">
          The Standard
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-50">
          Sign in
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500">
          Private. One account only.
        </p>
      </div>

      <Suspense fallback={<div className="text-neutral-500">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
