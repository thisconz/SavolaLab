import { betterAuth } from "better-auth";
import { pool } from "./db/client";

export const auth = betterAuth({
  database: pool,
  secret: process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "insecure-dev-secret",
  emailAndPassword: {
    enabled: true,
  },
});
