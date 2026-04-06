import { betterAuth } from "better-auth";
import { pool } from "./db/client";

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
});
