import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { pool } from "./client";

// ----------------------
// Single ORM instance
// ----------------------
export const dbOrm = drizzle(pool as Pool);
