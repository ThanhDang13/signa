import "tsconfig-paths/register";
import { defineConfig } from "drizzle-kit";

const { DB_NAME, DB_USER, DB_PASSWORD, DB_PORT, DB_HOST = "localhost" } = process.env;

if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_PORT) {
  throw new Error("Missing DB env variables");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schemas/index.ts",
  out: "./src/migrations",
  dbCredentials: {
    url: `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
  },
  migrations: {
    table: "__drizzle_migrations",
    schema: "public"
  },
  verbose: true,
  strict: true
});
