"use client";

import { useState, useTransition } from "react";
import { toggleStandardAction } from "./actions";

export function ActiveToggle({
  standardId,
  initialActive,
}: {
  standardId: string;
  initialActive: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const next = !active;
          startTransition(async () => {
            setError(null);
            const r = await toggleStandardAction(standardId, next);
            if (r.ok) setActive(next);
            else setError(r.error);
          });
        }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full ring-1 transition-colors disabled:opacity-50 ${
          active
            ? "bg-green-500 ring-green-500"
            : "bg-neutral-800 ring-neutral-700"
        }`}
        aria-pressed={active}
        aria-label={active ? "Active" : "Inactive"}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full transition-transform ${
            active
              ? "translate-x-6 bg-neutral-950"
              : "translate-x-1 bg-neutral-300"
          }`}
        />
      </button>
      {pending && (
        <span className="text-[11px] text-neutral-500">…</span>
      )}
      {error && (
        <span className="text-[11px] text-red-400">{error}</span>
      )}
    </div>
  );
}
