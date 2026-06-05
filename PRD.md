# The Standard — v1 PRD

**Product:** The Standard
**Version:** v1 — ruthless small build
**Owner:** Mitchell
**Status:** Updated PRD after UX scope audit
**Primary artefact:** Source-of-truth PRD for UX, product, and build planning
**Platform:** Web app, desktop and mobile browser
**User model:** Single-user private app

---

## 1. Product Summary

The Standard is a private, single-user personal chief-of-staff application that turns revenue pressure, daily standards, guided journalling, sales activity, and a Sunday OODA loop into a brutal execution system.

The product is **not** a general productivity dashboard. It is not a War Room OS. It is not a CRM. It is not a habit tracker with dark-mode branding.

The v1 wedge is:

> A pain-first morning brief, powered by a guided nightly journal, weekday sales metrics, simple standards, streaks, and a Sunday night OODA review.

The app exists to stop reactive scatter, expose dodging, protect current client delivery, and keep the user oriented towards the $10k/month target.

---

## 2. Problem Statement

The user is a solo consultant earning approximately **$8.3k AUD/month** and trying to reach **$10k AUD/month**.

The bottleneck is not capability. The bottleneck is focus, consistency, and commercial execution.

The recurring pattern:

- Cold calls start strong, then incoming work takes over.
- EFA/client work becomes urgent and can crowd out sales activity.
- Follow-ups get forgotten.
- Website tweaks, internal work, and “productive” tasks become hiding places.
- By the end of the week, it is unclear what actually moved the needle.
- The Codex and personal standards exist, but they are not operational inside the user’s day.

The Standard solves this by making the user face the revenue gap daily, log the truth nightly, and correct the system weekly.

---

## 3. Product Goals

### 3.1 Primary Goal

Help the user operate in alignment with their stated standards and move towards the $10k/month target through daily commercial execution.

### 3.2 v1 Product Promise

The app should answer four questions every week:

1. Did I create pipeline?
2. Did I protect current income?
3. Did I dodge the thing that would close the gap?
4. What rule changes next week?

### 3.3 What v1 must prove

v1 succeeds if the user keeps using the daily loop and can clearly see whether their actions are moving the revenue gap.

v1 does **not** need to prove that the app has every future War Room feature. It only needs to prove that the morning brief + nightly journal + weekly OODA loop changes behaviour.

---

## 4. Target User

### 4.1 Primary User

A solo consultant in Australia who:

- earns around $8.3k AUD/month;
- is targeting $10k AUD/month;
- has EFA as a major full-time client;
- needs to keep client delivery moving while creating new pipeline;
- uses the War Room Codex, Tenets, Sigils, Iron Mind, and Villain frame as personal operating standards;
- wants a system that is direct, brutal, and action-oriented.

### 4.2 User Mindset

The user does not need more soft motivation. They need:

- financial reality shown first;
- the gap made unavoidable;
- daily sales pressure;
- honest callouts;
- clear action;
- weekly correction;
- no room for vague self-deception.

---

## 5. User Quote Traceability

Every v1 must-have should map to either a direct user quote from the workshop or the original design document.

If a feature cannot be traced to a quote or source-of-truth input, it must be marked as an assumption, design recommendation, or v2 candidate.

| Product decision | Source quote / input | Requirement status |
|---|---|---|
| Pain-first brief | “PAIN first. im broke, remind me where i am and where i need to go.” | Must have |
| Brutal tone | “brutal” | Must have |
| Guided nightly prompts | “guiding prompts, they can change if need be. you lead this one.” | Must have |
| Standards | “training, nightly journal, cold calling 30 minutes, EFA…” | Must have |
| EFA/client delivery included | “content, ads, website work, emails, automations built.” | Must have |
| Deferred tasks require a date | “force a date.” | Must have |
| Revenue manually entered | “manually entered in settings.” | Must have |
| Days left in month | “yes” | Must have |
| Calls made tracked | “also ask how many calls were made.” | Must have |
| Weekly review / OODA | “weekly review yes. I want to ooda loop every sunday night.” | Must have |
| Sunday OODA replaces normal journal | “replace the normal” | Must have |
| No weekend cold calls | “i do not cold call on weekends…” | Must have |
| Weekends are family/self/business at night | “weekends are for family and working on myself or business at night.” | Must have |
| Saturday brief at 7am | “7am” | Must have |
| Reset inside app only | “only inside the app” | Should have, tiny only |
| Sunday night OODA only | “Sunday night ooda only” | Must have |
| Offers/proposals tracked | “yes” | Must have |
| Follow-ups tracked | “yes” | Must have |
| Follow-up textbox | “textbox” | Must have |
| Sales scoreboard every weekday | “everyday” | Must have |
| Money won split | “split off” | Must have |
| Revenue at risk | “yes” | Should have inside weekly review JSON |
| Written weekly report | “yes” | Should have, latest only |
| Google Calendar integration | Original design doc included Calendar, but workshop did not reinforce it. | Won’t have in ruthless v1 |
| Separate Prompt Editor screen | Design recommendation only. | Won’t have in v1; merge into Settings |
| Separate Villain Editor screen | Design recommendation only. | Won’t have in v1; merge into Settings |

---

## 6. Product Principles

### 6.1 Pain first

The first thing the user sees on weekday mornings is the financial reality:

- current monthly revenue;
- target monthly revenue;
- monthly gap;
- days left in the month;
- sales scoreboard.

The app should not open with inspiration, productivity tips, or a generic greeting.

### 6.2 Brutal by default

The product voice should be direct, honest, and confrontational when behaviour does not match stated standards.

The app should be brutal, but not vague. Brutality must be tied to receipts:

- missed calls;
- skipped tasks;
- deferred tasks;
- broken streaks;
- weak sales volume;
- missed journals;
- revenue at risk.

### 6.3 Receipts over vibes

The app should use actual logged behaviour to support callouts.

Examples:

- “0 calls yesterday.”
- “2 missed journals in a row.”
- “You deferred this task twice.”
- “You completed EFA work but sent 0 offers.”

### 6.4 Commercial output beats busyness

The app should distinguish between:

- creating pipeline;
- progressing follow-ups;
- sending offers/proposals;
- winning revenue;
- protecting client income;
- hiding in low-leverage work.

### 6.5 Different days need different standards

Weekdays, Saturday, and Sunday should not use the same pressure model.

- Monday–Friday: execution, calls, follow-ups, offers, client delivery, training.
- Saturday: family, self-work, training if planned, business work at night.
- Sunday: no morning brief, Sunday night OODA only.

### 6.6 The app must not become the avoidance

The product should avoid feature creep. v1 should not become a full War Room OS.

The rule:

> If a feature does not strengthen the morning brief, nightly truth, or Sunday correction loop, it does not belong in v1.

---

## 7. Template Inheritance Rule

The build must not recreate functionality the starter template already provides.

If the selected template already has a usable version of auth, layout, navigation, forms, database helpers, API route structure, styling primitives, settings patterns, or loading/error states, v1 must use the template implementation unless it directly blocks the product loop.

### 7.1 Do not rebuild in v1

- Authentication UI.
- Generic dashboard layout.
- Button/input components.
- Toasts/modals.
- Settings layout.
- Database client helpers.
- Mobile responsive shell.
- Error boundary patterns.
- Loading states.
- Form validation primitives.
- Existing navigation structure.

### 7.2 Customise only where it affects the core loop

Custom work should be limited to:

- pain-first brief display;
- sales scoreboard;
- nightly journal fields;
- standards check-ins;
- task done/skipped/deferred flow;
- Sunday OODA;
- Telegram delivery;
- prompt/AI generation logic.

This section exists to stop v1 from becoming a design-system rebuild.

---

## 8. Scope

### 8.1 Must Have

These are required for v1.

| Feature | Why it is required |
|---|---|
| Single-user auth gate | Private app for one user. |
| Today Command Centre | Main daily execution screen. |
| Pain block | Anchors the user to current revenue, target, gap, and days left. |
| Weekday sales scoreboard | Shows calls, follow-ups, offers, one-off revenue, recurring revenue. |
| Brutal honest callout | Core product value: confront dodging. |
| Top 3 tasks | Keeps the day small and focused. |
| do/delegate/delete/defer tags | Forces a decision on every task. |
| Done/skipped/deferred actions | Feeds tomorrow’s brief with execution data. |
| Skipped reason required | Prevents silent avoidance. |
| Deferred date required | Prevents defer becoming a soft skip. |
| Guided nightly journal | Source-of-truth daily input. |
| Nightly sales metrics | Tracks calls, follow-ups, offers, one-off revenue, recurring revenue. |
| Follow-up textbox | Adds context on who was followed up. |
| Simple standards check-ins | Tracks training, journal, cold calls, client delivery. |
| Streak calculation | Shows discipline reality. |
| Saturday mode on Today screen | Same screen, different content and timing. |
| Sunday OODA screen | Weekly correction loop. |
| Suggested weekly operating rule | Turns review into behaviour change. |
| Settings | Revenue, target, prompt, Villain, notification times, Telegram status. |
| Telegram morning delivery | Sends weekday and Saturday briefs. |
| Missed journal handling | Keeps system useful while calling out missing data. |

### 8.2 Should Have, if it stays tiny

These are useful, but must not delay the core loop.

| Feature | Constraint |
|---|---|
| Reset | Inside app only. Max 2/day. No history screen. |
| Written weekly report | Save latest report and basic past records only. |
| Revenue at risk | Capture inside Sunday OODA JSON, not as its own module. |
| Recent brief history | Last 7 briefs only. No calendar UI. |
| Recent journal history | Recent list only. No search/filter. |
| Telegram test/status | Minimal status and one test button only. |

### 8.3 Won’t Have in v1

These are explicitly cut so v1 ships small.

| Won’t have | Reason |
|---|---|
| Google Calendar integration | OAuth complexity. Workshop did not make it essential. Cut unless template gives it nearly free. |
| Calendar watch-outs | Depends on Calendar integration. V2. |
| Separate Prompt Editor screen | Prompt textarea lives in Settings. |
| Separate Villain Editor screen | Villain textarea lives in Settings. |
| Prompt versioning / restore flow | Too much for v1. Keep a default in repo. |
| Full Journal History search/filter | Recent entries only. Search/filter can wait. |
| Full Brief History calendar/list | Last 7 briefs only. |
| Weekly Reports History screen | No archive UI in v1 beyond basic records/latest report. |
| Reset history | Reset is a tool, not a module. |
| Tale filters | Tale tag can exist; filtering/search is v2. |
| Complex standards engine | Fixed/default standards with basic edit only. |
| Revenue at risk table/module | Store inside weekly review JSON. |
| Client CRM | Not building a CRM. |
| Proposal tracker | Only count offers/proposals in journal. |
| Financial integrations | Revenue is manually entered. |
| Slack/client integrations | Not needed for v1. |
| Native mobile app | Web app only. |
| Public signup/multi-tenant | Single user only. |
| War Room OS features | Sigil dashboards, Tale sharing, Iron Mind modules, social features, networking dashboards, energy audits are v2+. |

---

## 9. Core Behavioural Loop

### 9.1 Monday–Friday Loop

1. Morning brief arrives at 4am.
2. User opens brief when ready.
3. User sees pain block, sales scoreboard, honest callout, Villain note, Top 3, and streaks.
4. User executes during the day.
5. User marks brief items as done, skipped, or deferred.
6. User completes nightly journal.
7. Journal feeds the next brief.

### 9.2 Saturday Loop

1. Saturday brief arrives at 7am.
2. No cold-call pressure.
3. Brief focuses on family presence, self-work, and business building at night.
4. User completes guided nightly journal.

### 9.3 Sunday Loop

1. No Sunday morning brief.
2. No normal nightly journal.
3. Sunday night OODA review replaces the journal.
4. App reviews the week.
5. AI suggests next week’s operating rule.
6. User accepts or edits the rule.
7. Rule shapes next week’s briefs and relevant standard targets.

---

## 10. Operating Modes

### 10.1 Weekday Mode

**Active days:** Monday to Friday
**Brief time:** 4am local time
**Tone:** brutal, pain-first, commercially focused

Weekday focus:

- current revenue vs target;
- monthly gap;
- days left in month;
- sales scoreboard;
- cold calling;
- follow-ups;
- offers/proposals;
- one-off and recurring revenue won;
- EFA/client delivery;
- training;
- streaks;
- repeated dodges.

Active standards:

- training;
- nightly journal;
- cold calling 30 minutes;
- calls made;
- client delivery block.

### 10.2 Saturday Mode

**Active day:** Saturday
**Brief time:** 7am local time
**Tone:** direct, grounded, no weekday cold-call pressure

Saturday focus:

- family presence;
- self-work;
- training if planned;
- business building at night;
- no cold-call guilt.

Saturday should not:

- punish no cold calls;
- frame the day like a weekday sales day;
- become a second Sunday review;
- turn family time into checkbox theatre.

### 10.3 Sunday OODA Mode

**Active day:** Sunday
**Brief time:** none
**Review time:** Sunday night
**Tone:** brutal review, corrective, decision-focused

Sunday focus:

- observe the week;
- orient around the truth;
- decide the next operating rule;
- act by setting the rule for next week.

---

## 11. Screens and UX Foundation

This is the v1 screen map after the ruthless scope cut.

| Screen | Keep? | Purpose | User stories |
|---|---:|---|---|
| Sign In / Auth Gate | Must | Protects private single-user app. | As the user, I want to sign in with Google, so only I can access my private brief, journal, standards, and revenue data. |
| Today Command Centre | Must | Main daily execution screen. | As the user, I want to see my revenue gap, sales scoreboard, callout, Top 3, and streaks, so I know what matters today. |
| Saturday Mode on Today Screen | Must | Same Today screen, weekend rules. | As the user, I want Saturday to avoid cold-call pressure, so I am not judged against weekday standards. |
| Nightly Journal | Must | Guided daily input Monday–Saturday. | As the user, I want guided prompts and sales fields, so the app has the truth before tomorrow’s brief. |
| Sunday OODA Review | Must | Weekly correction screen. | As the user, I want Sunday night OODA to replace the normal journal, so I end the week with correction. |
| Standards | Must, simple | Basic standards and streaks. | As the user, I want standards with active days, so streaks are judged only when they apply. |
| Settings | Must | Revenue, prompt, Villain, Telegram, notification times. | As the user, I want to manually enter revenue and edit the prompt/Villain in one place, so the app stays calibrated. |
| Reset Modal | Should | 10-minute in-app reset. | As the user, I want one reset command, so I can interrupt reactive spirals without building another module. |
| Recent Briefs | Should | Last 7 briefs only. | As the user, I want to review recent briefs, so I can spot repeated skipped/deferred tasks. |
| Recent Journals | Should | Recent journal entries only. | As the user, I want to review recent journals, so I can see what I logged without needing search. |
| Latest Weekly Report | Should | Saved Sunday report. | As the user, I want a written weekly report, so I can review the week’s scoreboard and next rule. |
| Prompt Editor | Won’t | Separate screen cut. | Prompt editing lives in Settings. |
| Villain Editor | Won’t | Separate screen cut. | Villain editing lives in Settings. |
| Calendar Connection | Won’t | Cut from v1. | Calendar is v2 unless free from template. |
| Weekly Reports History | Won’t | Cut from v1. | Latest/basic records only. |

### 11.1 Recommended Navigation

Use minimal navigation. Do not create a heavy dashboard nav.

Primary items:

1. **Today** — Today Command Centre, Saturday mode, Reset modal.
2. **Journal** — Nightly Journal, recent journals.
3. **Weekly** — Sunday OODA, latest weekly report.
4. **Standards** — standards and streaks.
5. **Settings** — revenue, prompt, Villain, Telegram, notification times.

---

## 12. Feature Requirements

### 12.1 Pain-First Morning Brief

Required sections:

1. Pain block.
2. Sales scoreboard.
3. Honest callout.
4. Villain note.
5. Top 3 tasks.
6. Streak status.
7. Missed journal warning, if applicable.

Pain block fields:

- current monthly revenue;
- target monthly revenue;
- monthly gap;
- days left in month.

Example:

```text
CURRENT: $8,300/mo
TARGET: $10,000/mo
GAP: $1,700/mo
DAYS LEFT THIS MONTH: 18
```

### 12.2 Sales Scoreboard

The sales scoreboard appears every weekday.

Daily fields:

- calls made yesterday;
- follow-ups completed yesterday;
- offers/proposals sent yesterday;
- one-off revenue won yesterday;
- recurring revenue won yesterday.

Weekly fields:

- calls made this week;
- follow-ups completed this week;
- offers/proposals sent this week;
- one-off revenue won this week;
- recurring revenue won this week.

The AI should interpret whichever metric best exposes whether the user is moving the needle.

### 12.3 Top 3 Tasks

The brief generates exactly 3 priority tasks.

Each task includes:

- task name;
- bucket: do, delegate, delete, defer;
- why it matters;
- financial/pain link where relevant;
- optional Sigil;
- status: pending, done, skipped, deferred.

No more than 3 tasks in v1.

### 12.4 Task Actions

#### Done

Marks task as completed.

#### Skipped

Requires:

- skip reason category;
- reason text.

Skip categories:

- avoided it;
- genuinely impossible;
- client emergency;
- family/personal;
- wrong priority;
- unclear task;
- other.

#### Deferred

Requires:

- future date;
- optional time;
- reason.

If the same task is deferred repeatedly, the AI should call it out.

### 12.5 Guided Nightly Journal

Active Monday–Saturday only.

Sections:

#### Money movement

- What moved money today?
- Cold calls made.
- Follow-ups completed.
- Who did you follow up with?
- Offers/proposals sent.
- One-off revenue won today.
- Recurring revenue won today.

#### Dodging

- What did you dodge today?

#### Reactive pulls

- What pulled you reactive?

#### Tomorrow

- What has to happen tomorrow no matter what?

#### Standards

- Training completed?
- Nightly journal completed?
- Cold calling 30 minutes completed? Monday–Friday only.
- Client delivery block completed? Monday–Friday only.
- What client delivery task did you complete?

#### Tale tag

Optional:

- Victory;
- Adventure;
- Thankfulness;
- Empowerment;
- None.

Tale filtering/search is not v1.

### 12.6 Client Delivery Block

Standard name:

> Client delivery block

Valid examples:

- content;
- ads;
- website work;
- emails;
- automations built.

Required input:

> What client delivery task did you complete?

AI judgement:

The AI may challenge the work if it appears to be comfort work, cosmetic tweaking, or a distraction from sales activity.

### 12.7 Standards and Streaks

Initial standards:

1. Training.
2. Nightly journal.
3. Cold calling 30 minutes.
4. Calls made.
5. Client delivery block.

Each standard has:

- name;
- description;
- active days;
- active/inactive state;
- current streak.

Streaks only count on active days.

### 12.8 Sunday OODA Review

Sunday OODA replaces the normal journal.

#### Observe

Show the week’s receipts:

- current revenue;
- target revenue;
- monthly gap;
- days left in month;
- calls made;
- follow-ups completed;
- offers/proposals sent;
- one-off revenue won;
- recurring revenue won;
- revenue at risk;
- cold call blocks completed;
- training completed;
- client delivery blocks completed;
- journals completed;
- skipped tasks;
- deferred tasks;
- broken streaks;
- repeated dodges;
- strongest receipt/Tale, if any.

#### Orient

AI interprets what the pattern means.

#### Decide

AI suggests one operating rule for next week.

User can accept or edit it.

#### Act

Saved rule influences next week’s:

- Top 3 generation;
- honest callouts;
- relevant standard targets.

### 12.9 Weekly Report

Should-have, latest/basic only.

The Sunday OODA should generate a written weekly report that includes:

- scoreboard;
- what happened;
- what it means;
- repeated dodges;
- strongest receipts;
- revenue won;
- revenue at risk;
- next week’s operating rule;
- AI’s blunt summary.

Do not build a full weekly report archive UI in v1.

### 12.10 Reset

Should-have, if tiny.

Reset is an in-app modal only. No Telegram. No history screen. Max 2 resets per day.

Flow:

1. User taps Reset.
2. User selects state:
   - spiralling;
   - reactive;
   - avoiding calls;
   - overwhelmed;
   - wasting time;
   - angry/frustrated;
   - tired;
   - other.
3. User writes one sentence: “What are you avoiding or reacting to?”
4. AI returns:
   - truth;
   - next 10 minutes;
   - delete for now;
   - return to.
5. User marks whether they completed the reset action.

---

## 13. AI Behaviour Requirements

The AI must:

- start weekday briefs with financial pain;
- use a brutal, direct tone;
- reference receipts, not vague motivation;
- prioritise sales activity when the gap is alive;
- distinguish client delivery from pipeline creation;
- call out dodging after repeated skips/deferrals;
- use the weekly operating rule in next week’s briefs;
- generate strict JSON for briefs and reset outputs;
- avoid adding tasks beyond the Top 3.

The AI must not:

- flatter the user;
- produce generic productivity advice;
- soften repeated avoidance;
- treat EFA/client delivery as automatically equivalent to new pipeline;
- punish missing weekend cold calls;
- make Sunday a normal workday;
- invent data that was not logged.

---

## 14. Missed Journal Logic

The brief should still generate if the user misses the nightly journal. Blocking the brief creates an excuse to avoid the system.

### 0 missed journals

Normal brief.

### 1 missed journal

Normal brief, but pain block includes missing-journal callout.

Example:

> No journal logged last night. Today’s brief is running on weaker data because you starved the system of the truth.

### 2 missed journals in a row

Stricter brief using only known data:

- standards;
- unresolved tasks;
- sales metrics;
- weekly operating rule.

### 3 missed journals in a row

Reset-style brief:

- one revenue action;
- one standard;
- one instruction to journal tonight.

---

## 15. Notifications

### 15.1 Telegram

Telegram is used for morning brief delivery only.

### 15.2 Weekday Notification

Monday–Friday:

- brief generated at 4am local time;
- Telegram message sent with short summary and link.

### 15.3 Saturday Notification

Saturday:

- brief generated at 7am local time;
- Telegram message sent with weekend framing and link.

### 15.4 Sunday Notification

Sunday:

- no morning brief;
- no normal journal;
- optional evening reminder for OODA only if simple to implement.

### 15.5 Reset Notifications

Reset does not send Telegram messages.

---

## 16. Measurable Success Metrics

The original “brutally useful” goal is not measurable by itself, so v1 needs behavioural metrics.

| Metric | Definition | Target for 30-day test |
|---|---|---:|
| Brief open rate | Brief page opened or Telegram link clicked / expected brief days | 80%+ |
| Nightly journal completion rate | Journals submitted / expected journal days | 80%+ |
| Sunday OODA completion | Weekly reviews completed / expected Sundays | 75%+ |
| Task action rate | Top 3 items marked done/skipped/deferred / total Top 3 items | 90%+ |
| Skip/defer completeness | Skipped/deferred tasks with required reason/date | 100% |
| Cold call tracking completeness | Weekday entries with calls field completed | 90%+ |
| Follow-up tracking completeness | Entries with follow-up number and textbox completed | 80%+ |
| Offer tracking completeness | Entries with offers/proposals field completed | 90%+ |
| Revenue tracking completeness | Entries with one-off and recurring revenue fields completed | 90%+ |
| Standards check-in completeness | Active-day standard check-ins completed | 90%+ |
| Weekly operating rule saved | Rule accepted/edited each Sunday OODA | 100% |
| Missed journal recovery | After a missed journal, next journal completed within 24 hours | 70%+ |

### 16.1 Brutal Usefulness Proxy

Sunday OODA should ask:

> Did the brief inform your ego or feed it?

Options:

- informed it;
- fed it;
- too soft;
- too noisy;
- wrong priorities.

And:

> Did the brief change your behaviour this week?

Options:

- yes;
- no;
- partially.

These answers become the measurable proxy for “brutally useful”.

---

## 17. Data Model

Keep the data model small. Prefer JSON fields for Sunday/report data instead of creating modules too early.

### 17.1 user_settings

```sql
user_settings (
  id uuid primary key,
  user_id text unique,
  current_monthly_revenue numeric,
  target_monthly_revenue numeric,
  currency text default 'AUD',
  system_prompt text,
  villain_description text,
  weekday_brief_time time default '04:00',
  saturday_brief_time time default '07:00',
  telegram_chat_id text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

### 17.2 journal_entries

```sql
journal_entries (
  id uuid primary key,
  user_id text,
  date date,
  money_moved text,
  calls_made integer default 0,
  followups_completed integer default 0,
  followups_notes text,
  offers_sent integer default 0,
  one_off_revenue_won numeric default 0,
  recurring_revenue_won numeric default 0,
  dodged text,
  reactive_pulls text,
  tomorrow_must text,
  client_delivery_completed boolean,
  client_delivery_notes text,
  tale_type text null,
  created_at timestamptz default now()
)
```

### 17.3 standards

```sql
standards (
  id uuid primary key,
  user_id text,
  name text,
  description text,
  active boolean default true,
  active_days text[],
  created_at timestamptz default now()
)
```

### 17.4 standard_checkins

```sql
standard_checkins (
  id uuid primary key,
  standard_id uuid references standards(id),
  date date,
  hit boolean,
  value numeric null,
  notes text null,
  created_at timestamptz default now(),
  unique(standard_id, date)
)
```

### 17.5 briefs

```sql
briefs (
  id uuid primary key,
  user_id text,
  date date,
  mode text, -- weekday | saturday | missed_journal_reset
  payload jsonb,
  opened_at timestamptz null,
  generated_at timestamptz default now()
)
```

### 17.6 brief_items

```sql
brief_items (
  id uuid primary key,
  brief_id uuid references briefs(id),
  task text,
  tag text,
  sigil text null,
  status text default 'pending',
  skipped_reason_category text null,
  skipped_reason_text text null,
  deferred_to timestamptz null,
  deferred_reason text null,
  updated_at timestamptz default now()
)
```

### 17.7 weekly_reviews

```sql
weekly_reviews (
  id uuid primary key,
  user_id text,
  week_start date,
  week_end date,
  observe jsonb,
  orient text,
  decisions jsonb,
  next_week_rule text,
  usefulness_rating text null,
  behaviour_changed_rating text null,
  report_text text null,
  created_at timestamptz default now()
)
```

### 17.8 reset_sessions

```sql
reset_sessions (
  id uuid primary key,
  user_id text,
  date date,
  state text,
  avoidance_note text,
  payload jsonb,
  completed boolean null,
  created_at timestamptz default now(),
  completed_at timestamptz null
)
```

No separate revenue_at_risk table in v1. Store revenue-at-risk data inside `weekly_reviews.observe`.

---

## 18. Acceptance Criteria

### 18.1 Morning Brief

- Weekday brief displays current revenue, target revenue, gap, and days left in month.
- Weekday brief displays daily and weekly sales scoreboard.
- Brief displays exactly 3 Top 3 tasks.
- Each Top 3 task has do/delegate/delete/defer tag.
- Each task can be marked done, skipped, or deferred.
- Skipping requires category and reason text.
- Deferring requires future date and reason.
- Missed journal logic changes the brief copy and mode.

### 18.2 Saturday

- Saturday brief is generated/sent at 7am.
- Saturday does not include cold-call pressure.
- Saturday uses weekend framing.

### 18.3 Sunday

- Sunday has no morning brief.
- Sunday does not show normal journal.
- Sunday OODA review is available at night.
- Sunday OODA shows weekly scoreboard.
- Sunday OODA allows the user to accept/edit next week’s operating rule.
- Weekly rule is saved and used in the next week’s brief generation.

### 18.4 Nightly Journal

- Journal includes guided prompts.
- Journal includes calls, follow-ups, follow-up notes, offers, one-off revenue, recurring revenue.
- Journal includes dodging, reactive pulls, tomorrow must-do, client delivery notes, and optional Tale tag.
- Journal does not appear as the primary Sunday flow.

### 18.5 Standards

- User can view simple standards.
- Standards have active days.
- Streaks calculate only on active days.
- Cold calling does not break on weekends.

### 18.6 Settings

- User can manually edit current monthly revenue.
- User can manually edit target monthly revenue.
- App calculates monthly gap.
- User can edit system prompt in Settings.
- User can edit Villain description in Settings.
- User can view/update Telegram status if implemented.

### 18.7 Reset

- Reset opens inside app only.
- Reset asks for user state and avoidance note.
- Reset returns one 10-minute command.
- Reset asks whether command was completed.
- Reset is limited to 2 uses per day.

---

## 19. Build Notes

### 19.1 Recommended Stack

- Next.js App Router.
- Vercel.
- Postgres/Neon.
- Google sign-in allowlisted to one user.
- Anthropic API for brief/OODA/reset generation.
- Telegram Bot API for morning brief delivery.

### 19.2 Cron Behaviour

Vercel Cron is UTC-only, so use runtime local-date checks.

- Monday–Friday: generate at equivalent of 4am local time.
- Saturday: generate at equivalent of 7am local time.
- Sunday: no morning brief.

### 19.3 Build Priority

Build in this order:

1. Auth + Settings.
2. Nightly Journal.
3. Brief generation + Today screen.
4. Task actions.
5. Standards/streaks.
6. Telegram delivery.
7. Sunday OODA.
8. Should-have items only if the loop is already working.

---

## 20. V2 Parking Lot

These are not v1:

- Google Calendar integration.
- Calendar watch-outs.
- Full brief archive.
- Full journal search/filter.
- Tale filters.
- Prompt versioning.
- Villain builder wizard.
- Weekly reports history UI.
- Reset history.
- Client CRM.
- Proposal tracker.
- Revenue dashboard.
- Stripe/Xero integrations.
- Full War Room OS.
- Sigil scoring dashboard.
- Iron Mind module workflows.
- Tale sharing.
- Energy audits.
- Fitness logger.
- Networking dashboard.
- Native mobile app.
- Multi-user/team mode.

---

## 21. Final v1 Shape

The ruthless v1 is:

1. A weekday pain-first morning brief.
2. A weekday sales scoreboard.
3. A Top 3 with hard task actions.
4. A guided nightly journal.
5. Simple standards and streaks.
6. Saturday mode on the same Today screen.
7. Sunday night OODA.
8. A weekly operating rule.
9. Settings for revenue, prompt, Villain, and Telegram.
10. Telegram morning delivery.

Everything else is either tiny, optional, or cut.

The product ships when the loop works. Not when the system feels complete.
