import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);
const cols = await sql`
  select column_name, data_type, column_default
  from information_schema.columns
  where table_name = 'user_settings'
  order by ordinal_position
`;
console.log("user_settings columns:");
for (const c of cols) console.log(" ", c.column_name.padEnd(28), c.data_type);
