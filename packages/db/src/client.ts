import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { resolve } from "node:path";
import * as schema from "./schema.js";

// Attempt to load .env if DATABASE_URL is not set
if (!process.env["DATABASE_URL"]) {
  config({ path: resolve(process.cwd(), "../../.env") });
  config({ path: resolve(process.cwd(), ".env") });
}

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const url =
      process.env["DATABASE_URL"] ||
      "postgresql://placeholder:placeholder@localhost:5432/dealopoly?sslmode=require";
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

/**
 * Proxy object for `db` that lazily initializes on first property access.
 */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const instance = getDb();
    return Reflect.get(instance, prop, receiver);
  },
});

export type Db = NeonHttpDatabase<typeof schema>;
