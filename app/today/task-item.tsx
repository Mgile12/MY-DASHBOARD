"use client";

import { useState, useTransition } from "react";
import {
  markDoneAction,
  markSkippedAction,
  markDeferredAction,
  resetItemAction,
  type TaskActionResult,
} from "./actions";
import { SKIP_OPTIONS, skipCategoryLabel } from "./skip-categories";
import {
  Pill,
  btnPrimary,
  btnSubtle,
  btnGhost,
  inputCls,
  type PillVariant,
} from "@/app/_components/ui";

// Mirror of BriefItem with Date fields converted to strings (RSC serialisation
// boundary). The Server Component does the conversion before passing.
export type SerializedBriefItem = {
  id: string;
  position: number;
  task: string;
  tag: string;
  sigil: string | null;
  why: string | null;
  status: string;
  skippedReasonCategory: string | null;
  skippedReasonText: string | null;
  deferredTo: string | null;
  deferredReason: string | null;
};

type Mode = "view" | "skip" | "defer";

function tagVariant(tag: string): PillVariant {
  switch (tag) {
    case "do":
      return "do";
    case "delete":
      return "delete";
    case "defer":
      return "defer";
    case "delegate":
      return "delegate";
    default:
      return "neutral";
  }
}

export function TaskItem({ item }: { item: SerializedBriefItem }) {
  const [mode, setMode] = useState<Mode>("view");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<TaskActionResult>) => {
    startTransition(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error);
      else setMode("view");
    });
  };

  return (
    <li className="rounded-2xl bg-neutral-900 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="text-2xl font-extrabold tabular-nums text-neutral-600 shrink-0">
            {item.position}
          </span>
          <span className="text-[16px] font-semibold text-neutral-50 leading-snug">
            {item.task}
          </span>
        </div>
        <Pill variant={tagVariant(item.tag)}>{item.tag}</Pill>
      </div>

      {item.sigil && (
        <p className="pl-10 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
          Sigil · {item.sigil}
        </p>
      )}
      {item.why && (
        <p className="pl-10 text-[13px] text-neutral-400 leading-snug">
          {item.why}
        </p>
      )}

      {item.status === "done" && (
        <CompletedRow
          label="Done"
          variant="done"
          onReset={() => run(() => resetItemAction(item.id))}
          pending={pending}
        />
      )}

      {item.status === "skipped" && (
        <CompletedRow
          label={`Skipped — ${skipCategoryLabel(item.skippedReasonCategory)}${
            item.skippedReasonText ? `: ${item.skippedReasonText}` : ""
          }`}
          variant="skipped"
          onReset={() => run(() => resetItemAction(item.id))}
          pending={pending}
        />
      )}

      {item.status === "deferred" && (
        <CompletedRow
          label={`Deferred to ${formatDeferDate(item.deferredTo)}${
            item.deferredReason ? ` — ${item.deferredReason}` : ""
          }`}
          variant="deferred"
          onReset={() => run(() => resetItemAction(item.id))}
          pending={pending}
        />
      )}

      {item.status === "pending" && mode === "view" && (
        <div className="flex flex-wrap items-center gap-2 pl-10">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => markDoneAction(item.id))}
            className={btnPrimary + " text-[12px] px-3 py-1.5"}
          >
            Done
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setMode("skip")}
            className={btnSubtle}
          >
            Skip
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setMode("defer")}
            className={btnSubtle}
          >
            Defer
          </button>
        </div>
      )}

      {item.status === "pending" && mode === "skip" && (
        <form
          className="flex flex-col gap-3 pt-3 border-t border-neutral-800"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() => markSkippedAction(item.id, fd));
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Why are you skipping?
            </span>
            <select
              name="category"
              required
              defaultValue=""
              className={inputCls}
            >
              <option value="" disabled>
                Pick a category…
              </option>
              {SKIP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Reason (required)
            </span>
            <textarea name="reason" required rows={2} className={inputCls} />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className={btnPrimary + " text-[12px] px-3 py-1.5"}
            >
              {pending ? "Saving…" : "Mark skipped"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setError(null);
              }}
              className={btnGhost + " text-[12px] px-3 py-1.5"}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {item.status === "pending" && mode === "defer" && (
        <form
          className="flex flex-col gap-3 pt-3 border-t border-neutral-800"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() => markDeferredAction(item.id, fd));
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Defer to
            </span>
            <input
              name="deferredTo"
              type="date"
              required
              min={tomorrowISO()}
              defaultValue={tomorrowISO()}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Reason (required)
            </span>
            <textarea name="reason" required rows={2} className={inputCls} />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className={btnPrimary + " text-[12px] px-3 py-1.5"}
            >
              {pending ? "Saving…" : "Defer task"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setError(null);
              }}
              className={btnGhost + " text-[12px] px-3 py-1.5"}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-[12px] text-red-400">{error}</p>}
    </li>
  );
}

function CompletedRow({
  label,
  variant,
  onReset,
  pending,
}: {
  label: string;
  variant: PillVariant;
  onReset: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-neutral-800 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Pill variant={variant}>{variant}</Pill>
        <span className="text-[13px] text-neutral-300 truncate">{label}</span>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={onReset}
        className="text-[12px] text-neutral-500 hover:text-neutral-200 transition-colors shrink-0"
      >
        Reset
      </button>
    </div>
  );
}

function formatDeferDate(iso: string | null): string {
  if (!iso) return "?";
  return iso.slice(0, 10);
}

function tomorrowISO(): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
