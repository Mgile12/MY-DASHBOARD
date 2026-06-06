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
import {
  Card,
  Section,
  btnPrimary,
  textareaCls,
} from "@/app/_components/ui";

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
      className="space-y-8"
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
      <Section label="Decide — next week's operating rule">
        <Card>
          <p className="text-[12px] text-neutral-500 mb-3 leading-relaxed">
            Claude suggested this rule. Accept it or edit it before saving. It
            becomes the <code className="text-neutral-300">weekly_operating_rule</code>{" "}
            the next brief reads.
          </p>
          <textarea
            name="nextWeekRule"
            defaultValue={initial.nextWeekRule}
            rows={3}
            required
            className={textareaCls}
          />
          {initial.reasoning && (
            <p className="mt-3 text-[12px] text-neutral-400 leading-relaxed">
              <span className="text-neutral-500">Claude&apos;s reasoning:</span>{" "}
              {initial.reasoning}
            </p>
          )}
        </Card>
      </Section>

      <Section label="Did the brief inform your ego or feed it?">
        <Card>
          <p className="text-[12px] text-neutral-500 mb-3">
            PRD §16.1 — usefulness proxy.
          </p>
          <RadioGroup
            name="usefulnessRating"
            options={USEFULNESS_OPTIONS}
            labels={USEFULNESS_LABELS}
            defaultValue={initial.usefulnessRating}
          />
        </Card>
      </Section>

      <Section label="Did the brief change your behaviour this week?">
        <Card>
          <RadioGroup
            name="behaviourChangedRating"
            options={BEHAVIOUR_OPTIONS}
            labels={BEHAVIOUR_LABELS}
            defaultValue={initial.behaviourChangedRating}
          />
        </Card>
      </Section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={btnPrimary}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {result?.ok === true && (
          <span className="text-green-400 text-[13px]">saved</span>
        )}
        {result?.ok === false && (
          <span className="text-red-400 text-[13px]">{result.error}</span>
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
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const id = `${name}-${opt}`;
        const checked = defaultValue === opt;
        return (
          <label
            key={opt}
            htmlFor={id}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-semibold ring-1 transition-colors duration-150 ${
              checked
                ? "bg-neutral-50 text-neutral-950 ring-neutral-50"
                : "bg-neutral-800 text-neutral-300 ring-neutral-700 hover:bg-neutral-700 hover:text-neutral-50"
            }`}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={opt}
              defaultChecked={checked}
              className="sr-only peer"
              onChange={(e) => {
                // Toggle visual on all siblings via the label's peer pattern.
                // The radio handles state; visual is driven by `peer-checked` if used,
                // but we use defaultValue + uncontrolled, so re-paint via DOM:
                const form = (e.target as HTMLInputElement).form;
                if (!form) return;
                const inputs = form.querySelectorAll<HTMLInputElement>(
                  `input[name="${name}"]`,
                );
                inputs.forEach((input) => {
                  const lab = form.querySelector<HTMLLabelElement>(
                    `label[for="${input.id}"]`,
                  );
                  if (!lab) return;
                  if (input.checked) {
                    lab.classList.remove(
                      "bg-neutral-800",
                      "text-neutral-300",
                      "ring-neutral-700",
                      "hover:bg-neutral-700",
                      "hover:text-neutral-50",
                    );
                    lab.classList.add(
                      "bg-neutral-50",
                      "text-neutral-950",
                      "ring-neutral-50",
                    );
                  } else {
                    lab.classList.add(
                      "bg-neutral-800",
                      "text-neutral-300",
                      "ring-neutral-700",
                      "hover:bg-neutral-700",
                      "hover:text-neutral-50",
                    );
                    lab.classList.remove(
                      "bg-neutral-50",
                      "text-neutral-950",
                      "ring-neutral-50",
                    );
                  }
                });
              }}
            />
            {labels[opt]}
          </label>
        );
      })}
    </div>
  );
}
