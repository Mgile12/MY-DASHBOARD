import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const cols = await sql`
  select column_name, data_type
  from information_schema.columns
  where table_name = 'weekly_reviews'
  order by ordinal_position
`;
console.log("weekly_reviews columns:");
for (const c of cols) console.log(" ", c.column_name.padEnd(28), c.data_type);

const constraints = await sql`
  select tc.constraint_name, tc.constraint_type,
         string_agg(kcu.column_name, ',' order by kcu.ordinal_position) as cols
  from information_schema.table_constraints tc
  left join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
  where tc.table_name = 'weekly_reviews'
  group by tc.constraint_name, tc.constraint_type
  order by tc.constraint_type
`;
console.log("\nconstraints:");
for (const c of constraints)
  console.log(" ", (c.constraint_type ?? "?").padEnd(12), (c.constraint_name ?? "?").padEnd(45), c.cols ?? "");

const rows = await sql`select count(*)::int as n from weekly_reviews`;
console.log(`\nrows: ${rows[0].n}`);
