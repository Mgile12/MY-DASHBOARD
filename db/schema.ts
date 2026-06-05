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
