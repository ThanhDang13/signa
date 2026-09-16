import { pgTable, text, uuid, integer, pgEnum } from "drizzle-orm/pg-core";
import { asPgEnum, timestamps, ISO8601Timestamp } from "./helper.schema";

// ------------------- enums -------------------

export const OUTBOX_STATUSES = ["pending", "processing", "completed", "failed"] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

export const outboxStatusEnum = pgEnum("outbox_status", asPgEnum(OUTBOX_STATUSES));

// ------------------- ballot_generation_outbox -------------------

export const ballotGenerationOutbox = pgTable("ballot_generation_outbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  electionId: uuid("election_id").notNull(),
  ballotIds: text("ballot_ids").notNull(), // JSON-serialized array of all ballot IDs in the batch
  timestamp: ISO8601Timestamp("timestamp", { withTimezone: true }),
  status: outboxStatusEnum("status").notNull().default("pending").$type<OutboxStatus>(),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  processedAt: ISO8601Timestamp("processed_at", { withTimezone: true }),
  ...timestamps
});

// ------------------- omr_processing_outbox -------------------

export const omrProcessingOutbox = pgTable("omr_processing_outbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  ballotId: uuid("ballot_id").notNull(),
  s3Key: text("s3_key").notNull(),
  status: outboxStatusEnum("status").notNull().default("pending").$type<OutboxStatus>(),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  processedAt: ISO8601Timestamp("processed_at", { withTimezone: true }),
  ...timestamps
});
