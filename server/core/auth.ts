import { betterAuth } from "better-auth";
import { PostgresDialect } from "kysely"; // 1. Import the Dialect
import { pool } from "./db/client";

export const auth = betterAuth({
    database: {
        // 2. Initialize the actual Dialect class
        dialect: new PostgresDialect({
            pool: pool,
        }),
        type: "postgres",
    },
    emailAndPassword: {
        enabled: true,
    },
});