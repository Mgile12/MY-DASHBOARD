import { pgTable, uuid, text, numeric, time, timestamp } from "drizzle-orm/pg-core";

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
