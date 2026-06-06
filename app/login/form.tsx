"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "./actions";
import { btnPrimary, inputCls } from "@/app/_components/ui";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/today";
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const r = await loginAction(fd);
          if (r.ok) {
            router.replace(callbackUrl);
            router.refresh();
          } else {
            setError(r.error);
          }
        });
      }}
    >
      <Field label="Email">
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputCls}
          autoFocus
        />
      </Field>

      <Field label="Password">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputCls}
        />
      </Field>

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {error && (
        <p className="text-red-400 text-[13px]" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-400">
        {label}
      </span>
      {children}
    </label>
  );
}
