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
        className={`px-3 py-1 rounded text-xs font-semibold ${
          active
            ? "bg-black text-white"
            : "bg-neutral-200 text-neutral-700"
        } disabled:opacity-50`}
      >
        {pending ? "…" : active ? "Active" : "Inactive"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
