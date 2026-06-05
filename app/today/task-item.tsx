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

  const tagColour =
    item.tag === "do"
      ? "bg-black text-white"
      : item.tag === "delegate"
        ? "bg-blue-700 text-white"
        : item.tag === "delete"
          ? "bg-neutral-500 text-white"
          : "bg-amber-700 text-white";

  return (
    <li className="border border-neutral-200 rounded p-3 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">
          {item.position}. {item.task}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${tagColour}`}
        >
          {item.tag}
        </span>
      </div>
      {item.sigil && (
        <span className="text-xs text-neutral-500">Sigil: {item.sigil}</span>
      )}
      {item.why && <p className="text-sm text-neutral-700">{item.why}</p>}

      {item.status === "done" && (
        <CompletedRow
          label="Done"
          colour="text-green-700"
          onReset={() => run(() => resetItemAction(item.id))}
          pending={pending}
        />
      )}

      {item.status === "skipped" && (
        <CompletedRow
          label={`Skipped — ${skipCategoryLabel(item.skippedReasonCategory)}${
            item.skippedReasonText ? `: ${item.skippedReasonText}` : ""
          }`}
          colour="text-red-700"
          onReset={() => run(() => resetItemAction(item.id))}
          pending={pending}
        />
      )}

      {item.status === "deferred" && (
        <CompletedRow
          label={`Deferred to ${formatDeferDate(item.deferredTo)}${
            item.deferredReason ? ` — ${item.deferredReason}` : ""
          }`}
          colour="text-amber-700"
          onReset={() => run(() => resetItemAction(item.id))}
          pending={pending}
        />
      )}

      {item.status === "pending" && mode === "view" && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => markDoneAction(item.id))}
            className="px-3 py-1 rounded bg-black text-white text-xs disabled:opacity-50"
          >
            Done
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setMode("skip")}
            className="px-3 py-1 rounded border border-neutral-400 text-xs"
          >
            Skip
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setMode("defer")}
            className="px-3 py-1 rounded border border-neutral-400 text-xs"
          >
            Defer
          </button>
        </div>
      )}

      {item.status === "pending" && mode === "skip" && (
        <form
          className="flex flex-col gap-2 pt-2 border-t border-neutral-200"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() => markSkippedAction(item.id, fd));
          }}
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">Why are you skipping it?</span>
            <select
              name="category"
              required
              defaultValue=""
              className="rounded border border-neutral-300 px-2 py-1 text-sm bg-white text-black"
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
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">Reason (required)</span>
            <textarea
              name="reason"
              required
              rows={2}
              className="rounded border border-neutral-300 px-2 py-1 text-sm bg-white text-black"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1 rounded bg-black text-white text-xs disabled:opacity-50"
            >
              {pending ? "Saving…" : "Mark skipped"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setError(null);
              }}
              className="px-3 py-1 rounded text-xs text-neutral-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {item.status === "pending" && mode === "defer" && (
        <form
          className="flex flex-col gap-2 pt-2 border-t border-neutral-200"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() => markDeferredAction(item.id, fd));
          }}
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">Defer to</span>
            <input
              name="deferredTo"
              type="date"
              required
              min={tomorrowISO()}
              defaultValue={tomorrowISO()}
              className="rounded border border-neutral-300 px-2 py-1 text-sm bg-white text-black"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">Reason (required)</span>
            <textarea
              name="reason"
              required
              rows={2}
              className="rounded border border-neutral-300 px-2 py-1 text-sm bg-white text-black"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1 rounded bg-black text-white text-xs disabled:opacity-50"
            >
              {pending ? "Saving…" : "Defer task"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setError(null);
              }}
              className="px-3 py-1 rounded text-xs text-neutral-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </li>
  );
}

function CompletedRow({
  label,
  colour,
  onReset,
  pending,
}: {
  label: string;
  colour: string;
  onReset: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-1 border-t border-neutral-200 gap-3">
      <span className={`text-sm ${colour} font-medium`}>{label}</span>
      <button
        type="button"
        disabled={pending}
        onClick={onReset}
        className="text-xs text-neutral-500 hover:underline shrink-0"
      >
        Reset
      </button>
    </div>
  );
}

// Use the ISO string's YYYY-MM-DD prefix directly — avoids any Date
// constructor / locale formatting that would cause server (UTC) and
// client (AEST) to render different strings → hydration mismatch.
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
