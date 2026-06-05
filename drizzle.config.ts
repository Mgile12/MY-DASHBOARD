import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config({ path: ".env.local" });

// drizzle-kit needs a direct (non-pooled) connection.
// Strip "-pooler." host marker, channel_binding, and sslmode params —
// we control SSL via dbCredentials.ssl below.
const url = (process.env.DATABASE_URL ?? "")
  .replace(/[?&]channel_binding=[^&]+/g, "")
  .replace(/[?&]sslmode=[^&]+/g, "")
  .replace(/\?&/, "?")
  .replace(/[?&]$/, "");

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
    ssl: { rejectUnauthorized: false },
  },
} satisfies Config;
