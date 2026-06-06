// One-shot migration: add weekly_reviews.reflections jsonb column.
// drizzle-kit push asked an interactive question we can't answer over
// this transport (about a constraint that already exists), so apply
// the single ALTER directly. Idempotent — uses IF NOT EXISTS.

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE weekly_reviews ADD COLUMN IF NOT EXISTS reflections jsonb`;

const cols = await sql`
  select column_name, data_type
  from information_schema.columns
  where table_name = 'weekly_reviews' and column_name = 'reflections'
`;
if (cols.length === 0) {
  console.error("FAIL: column not present after ALTER");
  process.exit(1);
}
console.log("OK: reflections column present —", cols[0].data_type);
