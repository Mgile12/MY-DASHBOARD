"use client";

import { useState, useTransition } from "react";
import { saveSettings, type SettingsActionResult } from "./actions";
import {
  Card,
  btnPrimary,
  inputCls,
  textareaCls,
} from "@/app/_components/ui";

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
      className="space-y-8"
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
      <FormSection title="Revenue">
        <div className="grid grid-cols-2 gap-3">
          <MoneyInput
            name="currentMonthlyRevenue"
            label="Current /mo"
            defaultValue={initial.currentMonthlyRevenue}
          />
          <MoneyInput
            name="targetMonthlyRevenue"
            label="Target /mo"
            defaultValue={initial.targetMonthlyRevenue}
          />
        </div>
        <Field label="Currency">
          <input
            name="currency"
            defaultValue={initial.currency}
            className={inputCls + " max-w-[140px]"}
          />
        </Field>
      </FormSection>

      <FormSection title="System prompt">
        <Field
          label="System prompt"
          helper="The instruction Claude reads at the top of every brief. Use {{villain}} as a placeholder for the Villain description below."
        >
          <textarea
            name="systemPrompt"
            defaultValue={initial.systemPrompt}
            rows={10}
            className={textareaCls + " font-mono text-[13px] leading-relaxed"}
          />
        </Field>
      </FormSection>

      <FormSection title="Villain">
        <Field
          label="Villain description"
          helper="The version of you you're fighting. Read at the top of every weekday brief."
        >
          <textarea
            name="villainDescription"
            defaultValue={initial.villainDescription}
            rows={12}
            className={textareaCls + " leading-relaxed"}
          />
        </Field>
      </FormSection>

      <FormSection title="Brief schedule (AEST)">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Weekday">
            <input
              name="weekdayBriefTime"
              type="time"
              defaultValue={initial.weekdayBriefTime}
              className={inputCls}
            />
          </Field>
          <Field label="Saturday">
            <input
              name="saturdayBriefTime"
              type="time"
              defaultValue={initial.saturdayBriefTime}
              className={inputCls}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Telegram">
        <Field
          label="Chat ID"
          helper="Read-only — set as env var on Vercel."
        >
          <input
            value={initial.telegramChatId}
            readOnly
            className={inputCls + " opacity-60 cursor-not-allowed"}
          />
        </Field>
      </FormSection>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
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

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-500">
        {title}
      </h2>
      <Card>
        <div className="space-y-4">{children}</div>
      </Card>
    </section>
  );
}

// Stat-style money input — large bold number with $ prefix.
// Mirrors the scoreboard typography pattern so the revenue numbers
// (the whole point of the app) feel like the most important inputs.
function MoneyInput({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-neutral-400">
        {label}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] font-bold text-neutral-600 tabular-nums">
          $
        </span>
        <input
          name={name}
          defaultValue={defaultValue}
          inputMode="decimal"
          placeholder="0"
          className="w-full rounded-xl bg-neutral-950 ring-1 ring-neutral-800 pl-7 pr-3.5 py-2.5 text-[22px] font-extrabold text-neutral-50 placeholder:text-neutral-700 focus:ring-2 focus:ring-neutral-50/40 focus:outline-none transition-shadow duration-150 tabular-nums text-right"
        />
      </div>
    </label>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-neutral-400">
        {label}
      </span>
      {helper && (
        <span className="text-[12px] text-neutral-500 leading-snug">
          {helper}
        </span>
      )}
      {children}
    </label>
  );
}
