import { sql } from "drizzle-orm";
import { customType, text } from "drizzle-orm/pg-core";

// ------------------- helpers -------------------

export const asPgEnum = <T extends readonly string[]>(values: T) =>
  [...values] as unknown as [T[number], ...T[number][]];

// ------------------- custom types -------------------

export const ISO8601Timestamp = (
  name: string,
  config?: { withTimezone?: boolean; precision?: number }
) => {
  const precision = config?.precision !== undefined ? `(${config.precision})` : "";
  const dataType = `timestamp${precision}${config?.withTimezone ? " with time zone" : ""}`;

  return text(name)
    .notNull()
    .$type<string>()
    .$defaultFn(() => new Date().toISOString());
};

export const timestamps = {
  createdAt: ISO8601Timestamp("created_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  updatedAt: ISO8601Timestamp("updated_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull()
};
