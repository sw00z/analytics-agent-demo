// Neon serverless Postgres client.
// Used in Vercel Edge / Node runtimes; uses HTTP fetch under the hood
// so it works in both environments without a connection pool.

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and set it.",
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
