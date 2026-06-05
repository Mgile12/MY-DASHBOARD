import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  date,
  time,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  currentMonthlyRevenue: numeric("current_monthly_revenue"),
  targetMonthlyRevenue: numeric("target_monthly_revenue"),
  currency: text("currency").default("AUD"),
  systemPrompt: text("system_prompt"),
  villainDescription: text("villain_description"),
  weekdayBriefTime: time("weekday_brief_time").default("04:00"),
  saturdayBriefTime: time("saturday_brief_time").default("07:00"),
  telegramChatId: text("telegram_chat_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

// journal_entries — PRD §17.2 + 2 transient columns
// (training_completed, cold_calling_completed) for the standards
// check-ins in the journal form. Per Step 2 scope, the standards/
// standard_checkins tables aren't built yet (Step 5). These transient
// columns capture the data so the form is complete from day one;
// Step 5 migrates them out and removes them.
export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    date: date("date", { mode: "string" }).notNull(),

    // Money movement section (PRD §12.5)
    moneyMoved: text("money_moved"),
    callsMade: integer("calls_made").default(0),
    followupsCompleted: integer("followups_completed").default(0),
    followupsNotes: text("followups_notes"),
    offersSent: integer("offers_sent").default(0),
    oneOffRevenueWon: numeric("one_off_revenue_won").default("0"),
    recurringRevenueWon: numeric("recurring_revenue_won").default("0"),

    // Dodging / reactive / tomorrow
    dodged: text("dodged"),
    reactivePulls: text("reactive_pulls"),
    tomorrowMust: text("tomorrow_must"),

    // Standards section (client delivery is in PRD schema; training and
    // cold_calling are transient until Step 5 migrates them to standard_checkins)
    clientDeliveryCompleted: boolean("client_delivery_completed"),
    clientDeliveryNotes: text("client_delivery_notes"),
    trainingCompleted: boolean("training_completed"),
    coldCallingCompleted: boolean("cold_calling_completed"),

    // Tale tag (PRD §12.5)
    taleType: text("tale_type"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userDateUnique: unique("journal_entries_user_date_unique").on(
      t.userId,
      t.date,
    ),
  }),
);

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

// briefs — PRD §17.5
// One row per (user_id, date). Mode signals the brief's framing.
// Payload stores the full structured JSON returned by the AI so the
// page can render without re-querying — sales scoreboard, villain
// note, honest callout, watch_for, missed_journal_warning all live
// in payload.
export const briefs = pgTable(
  "briefs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    mode: text("mode").notNull(), // weekday | saturday | missed_journal_reset
    payload: jsonb("payload").notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userDateUnique: unique("briefs_user_date_unique").on(t.userId, t.date),
  }),
);

export type Brief = typeof briefs.$inferSelect;
export type NewBrief = typeof briefs.$inferInsert;

// brief_items — PRD §17.6
// The Top 3 actionable items extracted from each brief's payload.
// Stored separately so status updates (done/skipped/deferred) don't
// rewrite the whole brief blob (those Server Actions land in Step 4).
export const briefItems = pgTable("brief_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  briefId: uuid("brief_id")
    .notNull()
    .references(() => briefs.id, { onDelete: "cascade" }),
  position: integer("position").notNull(), // 1, 2, 3 — order in Top 3
  task: text("task").notNull(),
  tag: text("tag").notNull(), // do | delegate | delete | defer
  sigil: text("sigil"),
  why: text("why"),
  status: text("status").default("pending").notNull(), // pending | done | skipped | deferred
  skippedReasonCategory: text("skipped_reason_category"),
  skippedReasonText: text("skipped_reason_text"),
  deferredTo: timestamp("deferred_to", { withTimezone: true }),
  deferredReason: text("deferred_reason"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type BriefItem = typeof briefItems.$inferSelect;
export type NewBriefItem = typeof briefItems.$inferInsert;

// standards — PRD §17.3
// `key` is a stable code-side identifier (e.g. "training", "cold_calling_30min")
// so the journal action can look up standards without depending on the
// user-editable name. active_days is an array of "mon".."sun" strings;
// streaks only count those days.
export const standards = pgTable(
  "standards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    active: boolean("active").default(true).notNull(),
    activeDays: text("active_days").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userKeyUnique: unique("standards_user_key_unique").on(t.userId, t.key),
  }),
);

export type Standard = typeof standards.$inferSelect;
export type NewStandard = typeof standards.$inferInsert;

// standard_checkins — PRD §17.4
// One row per (standard_id, date). `value` is an optional numeric for
// quantitative standards (e.g. "Calls made" stores the count, "hit" still
// answers the boolean threshold). `notes` is reserved for future use.
export const standardCheckins = pgTable(
  "standard_checkins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    standardId: uuid("standard_id")
      .notNull()
      .references(() => standards.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    hit: boolean("hit").notNull(),
    value: numeric("value"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    standardDateUnique: unique("standard_checkins_standard_date_unique").on(
      t.standardId,
      t.date,
    ),
  }),
);

export type StandardCheckin = typeof standardCheckins.$inferSelect;
export type NewStandardCheckin = typeof standardCheckins.$inferInsert;
