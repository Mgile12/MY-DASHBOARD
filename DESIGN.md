# Design — The Standard

The visual spec for the morning-brief app. Read this before touching any UI.

The screen will be opened at 4am, one-handed, on a phone, while the user is
half-asleep. Every decision below serves that moment.

---

## North Star

**Athletic scoreboard energy + Iron Mind discipline + modern mobile card composition.**

Think Whoop / Strava finish screen, but for revenue. Think Bloomberg terminal, but at
phone scale. Think Jocko podcast page, but with real numbers. The user is not being
asked, they are being briefed. Numbers dominate, words support.

If a design choice would feel cozy, friendly, or "designed by committee," it is wrong.
If it would feel like a verdict, a scoreboard, or a system warning, it is right.

---

## Palette

Dark by default. There is no light mode. The user reads this at 4am.

| Token          | Hex       | Tailwind          | Use                                                  |
| -------------- | --------- | ----------------- | ---------------------------------------------------- |
| `bg`           | `#0a0a0a` | `neutral-950`     | Page background. Near-pure black, slight warmth.     |
| `surface`      | `#171717` | `neutral-900`     | Card backgrounds.                                    |
| `surface-2`    | `#262626` | `neutral-800`     | Nested cards, inputs, pressed states.                |
| `border`       | `#262626` | `neutral-800`     | Hairlines between rows, card edges where needed.     |
| `border-faint` | `#1f1f1f` | `neutral-800/60`  | Subtle dividers inside cards.                        |
| `fg`           | `#fafafa` | `neutral-50`      | Primary text, hero numbers.                          |
| `fg-muted`     | `#a3a3a3` | `neutral-400`     | Secondary text, labels.                              |
| `fg-subtle`    | `#737373` | `neutral-500`     | Metadata, timestamps, helper text.                   |
| `fg-faint`     | `#525252` | `neutral-600`     | Placeholders, disabled.                              |
| `danger`       | `#ef4444` | `red-500`         | The GAP, missed targets, Villain bar, danger banner. |
| `danger-fg`    | `#fef2f2` | `red-50`          | Text on red banners.                                 |
| `win`          | `#22c55e` | `green-500`       | Revenue won, follow-ups hit, positive deltas, DO.    |
| `warn`         | `#eab308` | `yellow-500`      | Caution / missed-journal warning (single use).       |

**Rules.**

- Only `danger`, `win`, and `warn` carry color. Everything else is neutral.
- `danger` is reserved for: GAP value, Villain left-bar, Honest Callout banner,
  DELETE status, negative deltas, missed-journal warning text.
- `win` is reserved for: revenue won, follow-ups completed, DO status, positive
  deltas, streak-active indicator.
- Never use purple, pink, orange, teal, or any pastel.
- No gradients. No shadows beyond the subtle card elevation (`shadow-sm` only).

---

## Typography

Geist Sans (already loaded by the Next scaffold) for everything. No serifs. No
monospace. Tabular-nums on every number that lives in a stat block, table row, or
scoreboard cell.

**Scale (mobile-first).**

| Token            | Size            | Weight | Tracking  | Use                                              |
| ---------------- | --------------- | ------ | --------- | ------------------------------------------------ |
| `text-stat-hero` | 48px / 3rem     | 800    | `-0.02em` | The GAP number. The biggest stat on any screen.  |
| `text-stat`      | 32px / 2rem     | 800    | `-0.02em` | Scoreboard cell big numbers.                     |
| `text-stat-sm`   | 24px / 1.5rem   | 700    | `-0.01em` | Secondary stat numbers (yesterday, deltas).      |
| `text-page`      | 24px / 1.5rem   | 700    | `-0.01em` | Page title (h1).                                 |
| `text-section`   | 18px / 1.125rem | 700    | `-0.005em`| Section heading inside a card.                   |
| `text-body`      | 15px            | 400    | `normal`  | Body copy.                                       |
| `text-body-md`   | 15px            | 500    | `normal`  | Emphasised body, button labels.                  |
| `text-label`     | 11px            | 600    | `0.12em`  | Section labels. UPPERCASE.                       |
| `text-tag`       | 10px            | 700    | `0.12em`  | Status pills (DO/DELETE/DEFER). UPPERCASE.       |
| `text-meta`      | 12px            | 400    | `normal`  | Timestamps, AEST date, footer metadata.          |

**Numbers always use `tabular-nums`** so the GAP doesn't shift when you change from
$8,300 to $9,300.

**The big-stat pattern (used everywhere data is shown):**

```
TINY UPPERCASE LABEL  (text-label, fg-muted)
HUGE NUMBER           (text-stat or text-stat-hero, fg, font-extrabold)
tiny delta line       (text-meta, fg-muted or danger/win)
```

That stacking — label-up-top, hero-number, delta-below — is the design's main motif.
Pulled directly from the TrackSense driver dashboard reference. Every scoreboard cell,
every standard, every revenue number uses it.

---

## Spacing

Base unit: 4px. Mobile-first. Generous vertical rhythm — the screen does not need
to fit a lot per viewport. Scroll is free.

| Token | px  | Use                                                           |
| ----- | --- | ------------------------------------------------------------- |
| `1`   | 4   | Inline gap between adjacent labels.                           |
| `2`   | 8   | Within a single card (label → number gap).                    |
| `3`   | 12  | Between rows in a stat group.                                 |
| `4`   | 16  | Card inner padding (mobile). Most "comfortable" tightness.    |
| `5`   | 20  | Card inner padding (desktop), section header bottom gap.      |
| `6`   | 24  | Between sibling cards.                                        |
| `8`   | 32  | Between major sections (Pain → Scoreboard → Villain).         |
| `10`  | 40  | Top of page below header.                                     |
| `12`  | 48  | Bottom of page above footer.                                  |

**Container.** Page is `px-5` (20px) on phone, `px-6` (24px) tablet+. Max content
width is **560px** even on desktop — this app is shaped like a phone everywhere.
Don't let it sprawl into a wide layout when read from desktop.

---

## Components

### Card

- Rounded `rounded-2xl` (16px).
- Background `bg-neutral-900`.
- No border by default. If a card needs separation from a similar adjacent card, use `ring-1 ring-neutral-800`.
- Inner padding `p-5` (20px).
- Vertical gap between sibling cards `gap-4` (16px).

### StatBlock (the workhorse component)

```
<div class="rounded-2xl bg-neutral-900 p-5">
  <div class="text-label text-neutral-400">CURRENT</div>
  <div class="text-stat text-neutral-50 mt-2 tabular-nums">$8,300</div>
  <div class="text-meta text-neutral-500 mt-1">vs target $10,000</div>
</div>
```

Stat grid is `grid grid-cols-2 gap-3` on phone, `grid-cols-3` on tablet+.

### HeroStat (only for the GAP)

```
<div class="rounded-2xl bg-neutral-900 p-6">
  <div class="text-label text-red-500">GAP</div>
  <div class="text-stat-hero text-red-500 mt-2 tabular-nums font-extrabold">$1,700</div>
  <div class="text-meta text-neutral-400 mt-1">18 days left in month</div>
</div>
```

The HeroStat is reserved for one number per screen — the most painful one. On /today
it's the GAP. On /weekly it's also the GAP, in the Observe block.

### Villain note

```
<aside class="border-l-4 border-red-500 pl-4 py-2">
  <div class="text-label text-red-500">VILLAIN</div>
  <p class="text-body-md text-neutral-100 mt-1">…</p>
</aside>
```

No card surround. Just the red bar. Looks like an indictment.

### Honest Callout

```
<div class="rounded-2xl bg-red-500 text-red-50 p-5">
  <div class="text-label">HONEST CALLOUT</div>
  <p class="text-section font-bold mt-2 leading-snug">…</p>
</div>
```

Full red background. White text. This is the only place a full color background is used.
It reads like a verdict.

### Pill / Tag

```
<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
             text-tag uppercase tracking-widest
             {variant}">
  DO
</span>
```

Variants:
- `do` → `bg-green-500/15 text-green-400 ring-1 ring-green-500/30`
- `delete` → `bg-red-500/15 text-red-400 ring-1 ring-red-500/30`
- `defer` → `bg-neutral-700/40 text-neutral-300 ring-1 ring-neutral-700`
- `done` → `bg-green-500 text-green-50`
- `skipped` → `bg-neutral-700 text-neutral-200`
- `deferred` → `bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30`

### Task row (Top 3)

```
<li class="rounded-2xl bg-neutral-900 p-5 flex flex-col gap-3">
  <div class="flex items-start justify-between gap-3">
    <div class="flex items-center gap-3">
      <span class="text-stat-sm text-neutral-500 tabular-nums">1</span>
      <span class="text-section text-neutral-50">…task…</span>
    </div>
    <Pill variant="do">Do</Pill>
  </div>
  <p class="text-meta text-neutral-400 pl-9">…why it matters…</p>
  <div class="flex gap-2 pl-9">
    <button …>Done</button>
    <button …>Skip</button>
    <button …>Defer</button>
  </div>
</li>
```

### Button

- **Primary**: `bg-neutral-50 text-neutral-950 rounded-xl px-4 py-2.5 text-body-md font-semibold`
- **Danger primary** (for "send to Telegram", "regenerate"): `bg-red-500 text-red-50 …`
- **Secondary / ghost**: `bg-neutral-800 text-neutral-100 …` or `ring-1 ring-neutral-700 text-neutral-200 bg-transparent …`
- **Status action** (Done / Skip / Defer in Top 3 card): small ghost buttons, `text-tag uppercase tracking-widest px-3 py-1.5 rounded-full ring-1 ring-neutral-700 hover:bg-neutral-800`

All buttons have a clear pressed/disabled state: `disabled:opacity-50 disabled:pointer-events-none`.
No motion beyond `transition-colors duration-150`.

### Input / Textarea

- `bg-neutral-900 ring-1 ring-neutral-800 rounded-xl px-3.5 py-2.5 text-body text-neutral-50 placeholder:text-neutral-600`
- Focus: `focus:ring-2 focus:ring-neutral-50/40 focus:outline-none`
- Time / number / date pickers use the same input shell.

### Header bar

- App title left: `THE STANDARD` in `text-label text-neutral-400`.
- Right side: small date + AEST timestamp in `text-meta text-neutral-500`.
- Below, on each route: `text-page` page title + `text-meta` subtitle (email · today AEST).
- Nav links in a horizontal scroll-free row, `text-body-md text-neutral-400`, active route `text-neutral-50`.

### Section header

- `text-label text-neutral-400` UPPERCASE label, then content.
- Use `mb-3` between section header and content.

---

## Layout

- Mobile-first. Single column. Card stack.
- `<main class="mx-auto max-w-[560px] px-5 sm:px-6 pt-6 pb-12">`.
- Sections stacked with `space-y-6` (24px).
- Within a section, items stacked with `space-y-3` or `space-y-4`.

---

## Motion

Minimal. Functional only.

- Page enter: none.
- Button press: `transition-colors duration-150`.
- Toggle / pill: `transition-colors duration-100`.
- No scroll choreography. No entrance animations. No spring/bounce.

---

## Tone of UI copy

- **Labels are commands or facts, never questions.** "PAIN" not "How's your gap?". "TOP 3" not "Your priorities today".
- Empty states get a brutal note, not a cheerful prompt. *"No journal logged last night. Today's brief is running on weaker data."*
- Buttons in imperative voice. "Save", "Regenerate", "Send to Telegram". Not "Save your settings".
- Helper text under inputs is concrete and short. "Days, blocks, numbers. Vague plans get vague weeks." (Pulled from the OODA reflection prompts — that voice carries through.)

---

## Conventions used everywhere

- AEST dates as `YYYY-MM-DD`. AEST times as `HH:MM AEST`. No localised formats.
- Money always shows the currency: `$8,300 AUD`.
- Numbers always tabular: `tabular-nums`.
- Negative deltas in `danger`. Positive deltas in `win`. Zero stays in `fg-muted`.
- Letter-spacing on all UPPERCASE labels is `0.12em` (tracking-widest in Tailwind).

---

## What to do when in doubt

Open the TrackSense driver dashboard reference. Look at the stat-card composition:
**tiny label / huge number / tiny delta**. Translate that pattern to dark mode.
That is 80% of this design.

The other 20% is the Villain bar + Honest Callout banner — those are the only places
the brutality breaks through visually. They should hit hard. Everything else is
quiet, dense, scoreboard.

---

## Appendix: original product notes (pre-spec, kept for context)

These are the v0 design notes from the early /office-hours session. They informed the
spec above but are not the spec themselves.

- Dark mode default.
- Mobile-first responsive.
- Single column, generous whitespace.
- No nav bar — pages linked from brief footer. *(Spec deviated: a small top nav across
  pages improves wayfinding on mobile and matches both reference screenshots.)*
- System fonts, Tailwind only. *(Spec deviated: Geist Sans is loaded by the Next
  scaffold and is the right choice for the bold-number-driven typography.)*
- The Villain note and honest_callout are visually distinct — bold, slightly bigger,
  no decoration. *(Carried forward as the Villain bar + Honest Callout banner above.)*
