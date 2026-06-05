"use client";

import { useState, useTransition } from "react";
import { saveJournal, type JournalActionResult } from "./actions";

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
      className="flex flex-col gap-8 max-w-2xl"
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
      {/* MONEY MOVEMENT */}
      <Section title="Money movement">
        <Field label="What moved money today?">
          <textarea
            name="moneyMoved"
            defaultValue={initial.moneyMoved}
            rows={3}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Cold calls made">
            <input
              name="callsMade"
              defaultValue={initial.callsMade}
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
          <Field label="Follow-ups completed">
            <input
              name="followupsCompleted"
              defaultValue={initial.followupsCompleted}
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
          <Field label="Offers/proposals sent">
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
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="One-off revenue won today">
            <input
              name="oneOffRevenueWon"
              defaultValue={initial.oneOffRevenueWon}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <Field label="Recurring revenue won today">
            <input
              name="recurringRevenueWon"
              defaultValue={initial.recurringRevenueWon}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* DODGING */}
      <Section title="Dodging">
        <Field label="What did you dodge today?">
          <textarea
            name="dodged"
            defaultValue={initial.dodged}
            rows={3}
            className={inputCls}
          />
        </Field>
      </Section>

      {/* REACTIVE PULLS */}
      <Section title="Reactive pulls">
        <Field label="What pulled you reactive?">
          <textarea
            name="reactivePulls"
            defaultValue={initial.reactivePulls}
            rows={3}
            className={inputCls}
          />
        </Field>
      </Section>

      {/* TOMORROW */}
      <Section title="Tomorrow">
        <Field label="What has to happen tomorrow no matter what?">
          <textarea
            name="tomorrowMust"
            defaultValue={initial.tomorrowMust}
            rows={3}
            className={inputCls}
          />
        </Field>
      </Section>

      {/* STANDARDS */}
      <Section title="Standards">
        <Checkbox
          name="trainingCompleted"
          defaultChecked={initial.trainingCompleted}
          label="Training completed"
        />
        {showWeekdayStandards && (
          <Checkbox
            name="coldCallingCompleted"
            defaultChecked={initial.coldCallingCompleted}
            label="Cold calling 30 minutes completed"
          />
        )}
        {showWeekdayStandards && (
          <>
            <Checkbox
              name="clientDeliveryCompleted"
              defaultChecked={initial.clientDeliveryCompleted}
              label="Client delivery block completed"
            />
            <Field label="What client delivery task did you complete?">
              <input
                name="clientDeliveryNotes"
                defaultValue={initial.clientDeliveryNotes}
                className={inputCls}
              />
            </Field>
          </>
        )}
      </Section>

      {/* TALE TAG */}
      <Section title="Tale tag (optional)">
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
      </Section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save journal"}
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-700">
        {title}
      </h2>
      {children}
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
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Checkbox({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4"
      />
      <span>{label}</span>
    </label>
  );
}
