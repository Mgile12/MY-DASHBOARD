// PRD §16.1 — Brutal Usefulness Proxy. Two ratings collected on Sunday OODA Loop.

export const USEFULNESS_OPTIONS = [
  "informed_it",
  "fed_it",
  "too_soft",
  "too_noisy",
  "wrong_priorities",
] as const;

export type UsefulnessRating = (typeof USEFULNESS_OPTIONS)[number];

export const BEHAVIOUR_OPTIONS = ["yes", "no", "partially"] as const;

export type BehaviourChangedRating = (typeof BEHAVIOUR_OPTIONS)[number];

export const USEFULNESS_LABELS: Record<UsefulnessRating, string> = {
  informed_it: "Informed it",
  fed_it: "Fed it",
  too_soft: "Too soft",
  too_noisy: "Too noisy",
  wrong_priorities: "Wrong priorities",
};

export const BEHAVIOUR_LABELS: Record<BehaviourChangedRating, string> = {
  yes: "Yes",
  no: "No",
  partially: "Partially",
};

// ---------------------------------------------------------------------------
// Reflection prompts — Sunday OODA Loop user-input questions.
// These are the primary signal the AI uses for Orient/Decide alongside
// the computed Observe scoreboard. Order matters — the AI reads them
// top-to-bottom.
// ---------------------------------------------------------------------------

export type ReflectionKey =
  | "goal"
  | "wins"
  | "dodged"
  | "obstacles"
  | "plan"
  | "one_thing";

export type ReflectionQuestion = {
  key: ReflectionKey;
  label: string;
  helper: string;
  placeholder: string;
  required: boolean;
  rows: number;
};

export const REFLECTION_QUESTIONS: readonly ReflectionQuestion[] = [
  {
    key: "goal",
    label: "What is your goal?",
    helper: "The number, the deadline, the why. Be specific.",
    placeholder: "$10k AUD/mo recurring by end of quarter, so I can fire the worst client.",
    required: true,
    rows: 3,
  },
  {
    key: "wins",
    label: "What did you get done last week to progress toward your goal?",
    helper: "Receipts only — proposals sent, calls booked, revenue won. Not effort.",
    placeholder: "Sent 2 proposals. Closed Acme retainer for $1.2k/mo. 38 cold calls Mon–Fri.",
    required: true,
    rows: 4,
  },
  {
    key: "dodged",
    label: "Where did you avoid the work that mattered?",
    helper:
      "The thing you knew you should do and didn't. Name it — that's the only way it stops winning.",
    placeholder: "Skipped Friday's cold-call block to redesign the website. Again.",
    required: false,
    rows: 3,
  },
  {
    key: "obstacles",
    label: "What are the biggest obstacles you need to overcome to achieve your goal?",
    helper: "Internal and external. Be honest about which is which.",
    placeholder:
      "External: pipeline is too dependent on referrals. Internal: I freeze on the dial after one no.",
    required: true,
    rows: 4,
  },
  {
    key: "plan",
    label: "What is your specific plan of action for this week to move closer to your goal?",
    helper: "Days, blocks, numbers. Vague plans get vague weeks.",
    placeholder:
      "Mon–Thu 8–10am cold-call block, target 30 calls/day. Two proposals out by Wed EOD.",
    required: true,
    rows: 5,
  },
  {
    key: "one_thing",
    label: "If you could only do ONE thing this week to close the gap, what would it be?",
    helper: "This primes next week's operating rule. The AI will sharpen what you write here.",
    placeholder: "Get a proposal in front of the GovTech lead before Tuesday lunch.",
    required: false,
    rows: 3,
  },
] as const;

export type Reflections = Partial<Record<ReflectionKey, string>>;
