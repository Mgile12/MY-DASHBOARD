"use client";

import { useState, useTransition } from "react";
import { sendBriefToTelegramAction } from "./actions";
import { btnGhost } from "@/app/_components/ui";

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
        className={btnGhost + " text-[12px] px-3 py-1.5"}
      >
        {pending ? "Sending…" : "Send to Telegram"}
      </button>
      {state.kind === "ok" && (
        <span className="text-[12px] text-green-400">sent</span>
      )}
      {state.kind === "error" && (
        <pre className="text-[12px] text-red-400 whitespace-pre-wrap max-w-md">
          {state.error}
        </pre>
      )}
    </div>
  );
}
