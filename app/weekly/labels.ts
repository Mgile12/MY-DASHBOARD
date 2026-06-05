// PRD §16.1 — Brutal Usefulness Proxy. Two ratings collected on Sunday OODA.

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
