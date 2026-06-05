"use client";

import { useState, useTransition } from "react";
import { sendBriefToTelegramAction } from "./actions";

export function TelegramButton() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "ok" } | { kind: "error"; error: string }
  >({ kind: "idle" });

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setState({ kind: "idle" });
            const r = await sendBriefToTelegramAction();
            if (r.ok) setState({ kind: "ok" });
            else setState({ kind: "error", error: r.error });
          });
        }}
        className="px-3 py-1 rounded border border-neutral-400 text-xs disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send to Telegram"}
      </button>
      {state.kind === "ok" && (
        <span className="text-xs text-green-700">sent</span>
      )}
      {state.kind === "error" && (
        <pre className="text-xs text-red-600 whitespace-pre-wrap max-w-md">
          {state.error}
        </pre>
      )}
    </div>
  );
}
