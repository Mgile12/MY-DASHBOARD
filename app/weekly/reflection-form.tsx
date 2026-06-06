"use client";

import { useState, useTransition } from "react";
import { generateOodaAction } from "./actions";
import { REFLECTION_QUESTIONS, type Reflections } from "./labels";
import { btnPrimary, textareaCls } from "@/app/_components/ui";

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
        <div key={q.key} className="flex flex-col gap-1.5">
          <label
            htmlFor={q.key}
            className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-400"
          >
            {q.label}
            {!q.required && (
              <span className="ml-2 text-neutral-600 font-normal normal-case tracking-normal text-[11px]">
                (optional)
              </span>
            )}
          </label>
          <p className="text-[12px] text-neutral-500 leading-snug">
            {q.helper}
          </p>
          <textarea
            id={q.key}
            name={q.key}
            defaultValue={initial[q.key] ?? ""}
            rows={q.rows}
            placeholder={q.placeholder}
            required={q.required}
            className={textareaCls + " mt-1"}
          />
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <button type="submit" disabled={pending} className={btnPrimary + " self-start"}>
          {pending ? "Generating…" : submitLabel}
        </button>
        {pending && (
          <span className="text-[12px] text-neutral-500">
            Calling Claude with your reflections + the week&apos;s receipts.
            Usually 8–15s.
          </span>
        )}
        {error && (
          <pre className="text-red-400 text-[12px] whitespace-pre-wrap max-w-full">
            {error}
          </pre>
        )}
      </div>
    </form>
  );
}
