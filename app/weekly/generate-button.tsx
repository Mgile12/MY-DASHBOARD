"use client";

import { useState, useTransition } from "react";
import { regenerateOodaAction } from "./actions";
import { btnPrimary, btnGhost } from "@/app/_components/ui";

export function GenerateOodaButton({
  regenerate = false,
}: {
  regenerate?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cls = regenerate
    ? `${btnGhost} text-[12px] px-3 py-1.5`
    : `${btnPrimary} self-start`;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setError(null);
            const r = await regenerateOodaAction();
            if (!r.ok) setError(r.error);
          });
        }}
        className={cls}
      >
        {pending
          ? "Generating…"
          : regenerate
            ? "Regenerate"
            : "Generate Sunday OODA Loop"}
      </button>
      {error && (
        <pre className="text-red-400 text-[12px] whitespace-pre-wrap max-w-full">
          {error}
        </pre>
      )}
    </div>
  );
}
