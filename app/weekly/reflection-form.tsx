"use client";

import { useState, useTransition } from "react";
import { generateOodaAction } from "./actions";
import { REFLECTION_QUESTIONS, type Reflections } from "./labels";

export function ReflectionForm({
  initial = {},
  submitLabel = "Generate Sunday OODA Loop",
}: {
  initial?: Reflections;
  submitLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const r = await generateOodaAction(fd);
          if (!r.ok) setError(r.error);
        });
      }}
    >
      {REFLECTION_QUESTIONS.map((q) => (
        <div key={q.key} className="flex flex-col gap-1">
          <label htmlFor={q.key} className="text-sm font-semibold">
            {q.label}
            {q.required ? (
              <span className="text-neutral-400 font-normal"></span>
            ) : (
              <span className="text-neutral-400 font-normal text-xs ml-2">
                (optional)
              </span>
            )}
          </label>
          <p className="text-xs text-neutral-500 leading-snug">{q.helper}</p>
          <textarea
            id={q.key}
            name={q.key}
            defaultValue={initial[q.key] ?? ""}
            rows={q.rows}
            placeholder={q.placeholder}
            required={q.required}
            className={inputCls}
          />
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {pending ? "Generating…" : submitLabel}
        </button>
        {pending && (
          <span className="text-xs text-neutral-500">
            Calling Claude with your reflections + the week&apos;s receipts — usually 8–15s.
          </span>
        )}
        {error && (
          <pre className="text-red-600 text-xs whitespace-pre-wrap max-w-2xl">
            {error}
          </pre>
        )}
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm bg-white text-black font-mono mt-1";
