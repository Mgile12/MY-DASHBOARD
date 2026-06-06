import Link from "next/link";
import type { ReactNode } from "react";

// =============================================================================
// Shared visual primitives — see DESIGN.md for the spec.
// =============================================================================

// ---------------------------------------------------------------------------
// Page chrome
// ---------------------------------------------------------------------------

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-[560px] px-5 sm:px-6 pt-6 pb-12">
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  subtitle,
  current,
}: {
  title: string;
  subtitle?: string;
  current: "today" | "journal" | "weekly" | "standards" | "settings";
}) {
  return (
    <header className="mb-8 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-neutral-500">
          The Standard
        </span>
        <span className="text-[12px] text-neutral-500 tabular-nums">
          {todayHeaderTimestamp()}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[12px] text-neutral-500">{subtitle}</p>
        )}
      </div>

      <Nav current={current} />
    </header>
  );
}

function Nav({
  current,
}: {
  current: "today" | "journal" | "weekly" | "standards" | "settings";
}) {
  const items: { href: string; label: string; key: typeof current }[] = [
    { href: "/today", label: "Today", key: "today" },
    { href: "/journal", label: "Journal", key: "journal" },
    { href: "/weekly", label: "Weekly", key: "weekly" },
    { href: "/standards", label: "Standards", key: "standards" },
    { href: "/settings", label: "Settings", key: "settings" },
  ];
  return (
    <nav className="flex items-center gap-4 overflow-x-auto text-[13px] font-medium -mx-1 px-1 pb-1">
      {items.map((item) => {
        const active = item.key === current;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={
              active
                ? "text-neutral-50"
                : "text-neutral-500 hover:text-neutral-200 transition-colors"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function todayHeaderTimestamp(): string {
  // Server-rendered, AEST. Deterministic so client + server agree.
  const AEST_OFFSET_MS = 10 * 60 * 60 * 1000;
  const a = new Date(Date.now() + AEST_OFFSET_MS);
  const y = a.getUTCFullYear();
  const mo = String(a.getUTCMonth() + 1).padStart(2, "0");
  const day = String(a.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day} AEST`;
}

// ---------------------------------------------------------------------------
// Surfaces — Card variants
// ---------------------------------------------------------------------------

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-neutral-900 p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Section({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-500">
          {label}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stats — the workhorse pattern: tiny label / huge number / tiny delta
// ---------------------------------------------------------------------------

export function StatBlock({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  tone?: "neutral" | "win" | "danger";
}) {
  const numColor =
    tone === "win"
      ? "text-green-400"
      : tone === "danger"
        ? "text-red-400"
        : "text-neutral-50";
  return (
    <Card>
      <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-500">
        {label}
      </div>
      <div
        className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums mt-2 ${numColor}`}
      >
        {value}
      </div>
      {delta && (
        <div className="text-[12px] text-neutral-500 mt-1 tabular-nums">
          {delta}
        </div>
      )}
    </Card>
  );
}

export function HeroStat({
  label,
  value,
  sub,
  tone = "danger",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "danger" | "neutral";
}) {
  const color = tone === "danger" ? "text-red-500" : "text-neutral-50";
  return (
    <Card>
      <div
        className={`text-[11px] font-semibold tracking-[0.16em] uppercase ${
          tone === "danger" ? "text-red-500" : "text-neutral-400"
        }`}
      >
        {label}
      </div>
      <div
        className={`text-5xl sm:text-6xl font-extrabold tracking-tight tabular-nums mt-2 ${color}`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[12px] text-neutral-400 mt-1">{sub}</div>
      )}
    </Card>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

// ---------------------------------------------------------------------------
// Tags / pills
// ---------------------------------------------------------------------------

export type PillVariant =
  | "do"
  | "delete"
  | "defer"
  | "delegate"
  | "done"
  | "skipped"
  | "deferred"
  | "neutral";

const PILL_CLASSES: Record<PillVariant, string> = {
  do: "bg-green-500/15 text-green-400 ring-1 ring-green-500/30",
  delete: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  delegate: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
  defer: "bg-neutral-700/40 text-neutral-300 ring-1 ring-neutral-700",
  done: "bg-green-500 text-green-50",
  skipped: "bg-neutral-700 text-neutral-200",
  deferred: "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30",
  neutral: "bg-neutral-800 text-neutral-300 ring-1 ring-neutral-700",
};

export function Pill({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: PillVariant;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.14em] uppercase ${PILL_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Villain + Honest callout — the brutal blocks
// ---------------------------------------------------------------------------

export function VillainNote({ text }: { text: string }) {
  return (
    <aside className="border-l-4 border-red-500 pl-4 py-1">
      <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-red-500">
        Villain
      </div>
      <p className="mt-1.5 text-[15px] font-medium leading-snug text-neutral-50">
        {text}
      </p>
    </aside>
  );
}

export function HonestCallout({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-red-500 text-red-50 p-6 sm:p-7">
      <div className="text-[11px] font-bold tracking-[0.18em] uppercase">
        Honest Callout
      </div>
      <p className="mt-3 text-[20px] font-bold leading-[1.3]">{text}</p>
    </div>
  );
}

export function WarningCard({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-yellow-500/10 ring-1 ring-yellow-500/30 p-4">
      <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-yellow-400">
        {label}
      </div>
      <p className="mt-1.5 text-[14px] text-yellow-100 leading-snug">
        {text}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buttons + inputs
// ---------------------------------------------------------------------------

export const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-neutral-50 text-neutral-950 px-4 py-2.5 text-[14px] font-semibold transition-colors duration-150 hover:bg-neutral-200 disabled:opacity-50 disabled:pointer-events-none";

export const btnDanger =
  "inline-flex items-center justify-center rounded-xl bg-red-500 text-red-50 px-4 py-2.5 text-[14px] font-semibold transition-colors duration-150 hover:bg-red-600 disabled:opacity-50 disabled:pointer-events-none";

export const btnGhost =
  "inline-flex items-center justify-center rounded-xl bg-neutral-800 text-neutral-100 px-4 py-2.5 text-[14px] font-semibold transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50 disabled:pointer-events-none";

export const btnSubtle =
  "inline-flex items-center justify-center rounded-full ring-1 ring-neutral-700 text-neutral-300 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] uppercase transition-colors duration-150 hover:bg-neutral-800 hover:text-neutral-50 disabled:opacity-50 disabled:pointer-events-none";

export const inputCls =
  "w-full rounded-xl bg-neutral-900 ring-1 ring-neutral-800 px-3.5 py-2.5 text-[14px] text-neutral-50 placeholder:text-neutral-600 focus:ring-2 focus:ring-neutral-50/40 focus:outline-none transition-shadow duration-150 tabular-nums";

// Textarea variant — no tabular-nums (these hold free-form prose, not numbers).
export const textareaCls =
  "w-full rounded-xl bg-neutral-900 ring-1 ring-neutral-800 px-3.5 py-2.5 text-[14px] text-neutral-50 placeholder:text-neutral-600 focus:ring-2 focus:ring-neutral-50/40 focus:outline-none transition-shadow duration-150 leading-relaxed";

// ---------------------------------------------------------------------------
// Footer meta strip
// ---------------------------------------------------------------------------

export function FooterMeta({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <footer className="border-t border-neutral-900 pt-4 mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[12px] text-neutral-500">
      <div>{left}</div>
      <div className="flex items-center gap-3">{right}</div>
    </footer>
  );
}
