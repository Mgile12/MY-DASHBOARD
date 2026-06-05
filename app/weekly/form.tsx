"use client";

import { useState, useTransition } from "react";
import { saveOodaAction, type SaveOodaResult } from "./actions";
import {
  BEHAVIOUR_LABELS,
  BEHAVIOUR_OPTIONS,
  USEFULNESS_LABELS,
  USEFULNESS_OPTIONS,
  type BehaviourChangedRating,
  type UsefulnessRating,
} from "./labels";

type Initial = {
  nextWeekRule: string;
  reasoning: string;
  usefulnessRating: UsefulnessRating | "";
  behaviourChangedRating: BehaviourChangedRating | "";
};

export function OodaForm({ initial }: { initial: Initial }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SaveOodaResult | null>(null);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setResult(null);
          const r = await saveOodaAction(fd);
          setResult(r);
        });
      }}
    >
      <section className="border border-black p-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-2">
          Decide — next week&apos;s operating rule
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          AI suggested this rule. Accept it or edit it before saving — it
          becomes the <code>weekly_operating_rule</code> the next brief reads.
        </p>
        <textarea
          name="nextWeekRule"
          defaultValue={initial.nextWeekRule}
          rows={3}
          required
          className={inputCls}
        />
        {initial.reasoning && (
          <p className="mt-3 text-xs text-neutral-600 italic leading-snug">
            AI reasoning: {initial.reasoning}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-1">
          Did the brief inform your ego or feed it?
        </h2>
        <p className="text-xs text-neutral-500 mb-2">PRD §16.1 — usefulness proxy.</p>
        <RadioGroup
          name="usefulnessRating"
          options={USEFULNESS_OPTIONS}
          labels={USEFULNESS_LABELS}
          defaultValue={initial.usefulnessRating}
        />
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-1">
          Did the brief change your behaviour this week?
        </h2>
        <RadioGroup
          name="behaviourChangedRating"
          options={BEHAVIOUR_OPTIONS}
          labels={BEHAVIOUR_LABELS}
          defaultValue={initial.behaviourChangedRating}
        />
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {result?.ok === true && (
          <span className="text-green-600 text-sm">saved</span>
        )}
        {result?.ok === false && (
          <span className="text-red-600 text-sm">{result.error}</span>
        )}
      </div>
    </form>
  );
}

function RadioGroup<T extends string>({
  name,
  options,
  labels,
  defaultValue,
}: {
  name: string;
  options: readonly T[];
  labels: Record<T, string>;
  defaultValue: T | "";
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt}
            defaultChecked={defaultValue === opt}
            className="accent-black"
          />
          {labels[opt]}
        </label>
      ))}
    </div>
  );
}

const inputCls =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm bg-white text-black font-mono";
