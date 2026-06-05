"use client";

import { useState, useTransition } from "react";
import { generateBriefAction } from "./actions";

export function GenerateButton({ regenerate = false }: { regenerate?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setError(null);
            const r = await generateBriefAction();
            if (!r.ok) setError(r.error);
          });
        }}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50 self-start"
      >
        {pending
          ? "Generating…"
          : regenerate
            ? "Regenerate brief"
            : "Generate today's brief"}
      </button>
      {error && (
        <pre className="text-red-600 text-xs whitespace-pre-wrap max-w-2xl">
          {error}
        </pre>
      )}
    </div>
  );
}
