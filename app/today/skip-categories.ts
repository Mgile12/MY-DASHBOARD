// PRD §12.4 skip categories. Kept in a non-"use server" file so it can be
// imported from both the Server Action and the Client Component without
// hitting Next.js's rule that "use server" files only export async functions.

export const SKIP_CATEGORIES = [
  "avoided_it",
  "genuinely_impossible",
  "client_emergency",
  "family_personal",
  "wrong_priority",
  "unclear_task",
  "other",
] as const;

export type SkipCategory = (typeof SKIP_CATEGORIES)[number];

export const SKIP_OPTIONS: { value: SkipCategory; label: string }[] = [
  { value: "avoided_it", label: "I avoided it" },
  { value: "genuinely_impossible", label: "Genuinely impossible" },
  { value: "client_emergency", label: "Client emergency" },
  { value: "family_personal", label: "Family / personal" },
  { value: "wrong_priority", label: "Wrong priority" },
  { value: "unclear_task", label: "Unclear task" },
  { value: "other", label: "Other" },
];

export function skipCategoryLabel(value: string | null): string {
  if (!value) return "(no category)";
  return SKIP_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
