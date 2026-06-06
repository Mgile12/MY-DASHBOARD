"use client";

import { useState, useTransition } from "react";
import { saveJournal, type JournalActionResult } from "./actions";
import {
  Card,
  btnPrimary,
  inputCls,
  textareaCls,
} from "@/app/_components/ui";

type Initial = {
  moneyMoved: string;
  callsMade: string;
  followupsCompleted: string;
  followupsNotes: string;
  offersSent: string;
  oneOffRevenueWon: string;
  recurringRevenueWon: string;
  dodged: string;
  reactivePulls: string;
  tomorrowMust: string;
  clientDeliveryCompleted: boolean;
  clientDeliveryNotes: string;
  trainingCompleted: boolean;
  coldCallingCompleted: boolean;
  taleType: "" | "victory" | "adventure" | "thankfulness" | "empowerment";
};

// dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat
// Per PRD §10.2 / §12.5, Saturday hides cold-calling and client-delivery
// questions. Sunday never reaches this form (page redirects to placeholder).
export function JournalForm({
  initial,
  dayOfWeek,
}: {
  initial: Initial;
  dayOfWeek: number;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<JournalActionResult | null>(null);

  const showWeekdayStandards = dayOfWeek >= 1 && dayOfWeek <= 5;

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setResult(null);
          const r = await saveJournal(fd);
          setResult(r);
        });
      }}
    >
      <FormSection title="Money movement">
        <Field label="What moved money today?">
          <textarea
            name="moneyMoved"
            defaultValue={initial.moneyMoved}
            rows={3}
            className={textareaCls}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Calls">
            <input
              name="callsMade"
              defaultValue={initial.callsMade}
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
          <Field label="Follow-ups">
            <input
              name="followupsCompleted"
              defaultValue={initial.followupsCompleted}
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
          <Field label="Offers">
            <input
              name="offersSent"
              defaultValue={initial.offersSent}
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Who did you follow up with?">
          <textarea
            name="followupsNotes"
            defaultValue={initial.followupsNotes}
            rows={2}
            className={textareaCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="One-off revenue won">
            <input
              name="oneOffRevenueWon"
              defaultValue={initial.oneOffRevenueWon}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <Field label="Recurring revenue won">
            <input
              name="recurringRevenueWon"
              defaultValue={initial.recurringRevenueWon}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Dodging">
        <Field label="What did you dodge today?">
          <textarea
            name="dodged"
            defaultValue={initial.dodged}
            rows={3}
            className={textareaCls}
          />
        </Field>
      </FormSection>

      <FormSection title="Reactive pulls">
        <Field label="What pulled you reactive?">
          <textarea
            name="reactivePulls"
            defaultValue={initial.reactivePulls}
            rows={3}
            className={textareaCls}
          />
        </Field>
      </FormSection>

      <FormSection title="Tomorrow">
        <Field label="What has to happen tomorrow no matter what?">
          <textarea
            name="tomorrowMust"
            defaultValue={initial.tomorrowMust}
            rows={3}
            className={textareaCls}
          />
        </Field>
      </FormSection>

      <FormSection title="Standards">
        <Toggle
          name="trainingCompleted"
          defaultChecked={initial.trainingCompleted}
          label="Training completed"
        />
        {showWeekdayStandards && (
          <Toggle
            name="coldCallingCompleted"
            defaultChecked={initial.coldCallingCompleted}
            label="Cold calling 30 min completed"
          />
        )}
        {showWeekdayStandards && (
          <>
            <Toggle
              name="clientDeliveryCompleted"
              defaultChecked={initial.clientDeliveryCompleted}
              label="Client delivery block completed"
            />
            <Field label="Which client delivery task?">
              <input
                name="clientDeliveryNotes"
                defaultValue={initial.clientDeliveryNotes}
                className={inputCls}
              />
            </Field>
          </>
        )}
      </FormSection>

      <FormSection title="Tale tag (optional)">
        <Field label="If today was a Tale, what type?">
          <select
            name="taleType"
            defaultValue={initial.taleType}
            className={inputCls}
          >
            <option value="">None</option>
            <option value="victory">Tale of Victory</option>
            <option value="adventure">Tale of Adventure</option>
            <option value="thankfulness">Tale of Thankfulness</option>
            <option value="empowerment">Tale of Empowerment</option>
          </select>
        </Field>
      </FormSection>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving…" : "Save journal"}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-neutral-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group/tg">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-neutral-800 ring-1 ring-neutral-700 transition-colors group-has-[:checked]/tg:bg-green-500 group-has-[:checked]/tg:ring-green-500">
        <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-neutral-300 transition-transform translate-x-1 group-has-[:checked]/tg:translate-x-4 group-has-[:checked]/tg:bg-neutral-950" />
      </span>
      <span className="text-[14px] text-neutral-200 group-hover/tg:text-neutral-50 transition-colors">
        {label}
      </span>
    </label>
  );
}
