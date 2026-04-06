import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "./client";

// ----------------------
// Exported ORM instance
// ----------------------
export const dbOrm = drizzle(pool);