"use client";

import { useState, useTransition } from "react";
import { saveSettings, type SettingsActionResult } from "./actions";

type Initial = {
  currentMonthlyRevenue: string;
  targetMonthlyRevenue: string;
  currency: string;
  systemPrompt: string;
  villainDescription: string;
  weekdayBriefTime: string;
  saturdayBriefTime: string;
  telegramChatId: string;
};

export function SettingsForm({ initial }: { initial: Initial }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SettingsActionResult | null>(null);

  return (
    <form
      className="flex flex-col gap-5 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setResult(null);
          const r = await saveSettings(fd);
          setResult(r);
        });
      }}
    >
      <Field label="Current monthly revenue">
        <input
          name="currentMonthlyRevenue"
          defaultValue={initial.currentMonthlyRevenue}
          inputMode="decimal"
          className={inputCls}
        />
      </Field>

      <Field label="Target monthly revenue">
        <input
          name="targetMonthlyRevenue"
          defaultValue={initial.targetMonthlyRevenue}
          inputMode="decimal"
          className={inputCls}
        />
      </Field>

      <Field label="Currency">
        <input
          name="currency"
          defaultValue={initial.currency}
          className={inputCls}
        />
      </Field>

      <Field label="System prompt">
        <textarea
          name="systemPrompt"
          defaultValue={initial.systemPrompt}
          rows={6}
          className={inputCls}
        />
      </Field>

      <Field label="Villain description">
        <textarea
          name="villainDescription"
          defaultValue={initial.villainDescription}
          rows={10}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Weekday brief time">
          <input
            name="weekdayBriefTime"
            type="time"
            defaultValue={initial.weekdayBriefTime}
            className={inputCls}
          />
        </Field>
        <Field label="Saturday brief time">
          <input
            name="saturdayBriefTime"
            type="time"
            defaultValue={initial.saturdayBriefTime}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Telegram chat ID (from env, read-only)">
        <input
          value={initial.telegramChatId}
          readOnly
          className={`${inputCls} opacity-60`}
        />
      </Field>

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

const inputCls =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm bg-white text-black";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
