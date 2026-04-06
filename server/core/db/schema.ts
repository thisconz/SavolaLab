import { pgTable, serial, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  employee_number: varchar("employee_number", { length: 50 }).notNull().unique(),
  username: varchar("username", { length: 50 }),
  role: varchar("role", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  initials: varchar("initials", { length: 10 }),
  dept: varchar("dept", { length: 50 }),
  status: varchar("status", { length: 20 }).default("offline"),
  online: boolean("online").default(false),
  created_at: timestamp("created_at").defaultNow(),
});