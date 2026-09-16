import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type AppDatabase<TSchema extends Record<string, unknown> = Record<string, never>> =
  NodePgDatabase<TSchema>;

export type AppTransaction<TSchema extends Record<string, unknown> = Record<string, never>> =
  Parameters<Parameters<AppDatabase<TSchema>["transaction"]>[0]>[0];

export type Executor<TSchema extends Record<string, unknown> = Record<string, never>> =
  AppDatabase<TSchema> | AppTransaction<TSchema>;
