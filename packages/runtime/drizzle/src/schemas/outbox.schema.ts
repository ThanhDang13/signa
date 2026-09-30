import { pgTable, text, uuid, integer, pgEnum, jsonb, index, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { asPgEnum, timestamps, ISO8601Timestamp } from "./helper.schema";

// ------------------- enums -------------------

export const OUTBOX_STATUSES = ["pending", "processing", "completed", "failed"] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

export const outboxStatusEnum = pgEnum("outbox_status", asPgEnum(OUTBOX_STATUSES));

export const VALIDATION_STATUSES = [
  "valid",
  "invalid_markers",
  "invalid_qr",
  "invalid_selections",
  "invalid_confidence"
] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export const validationStatusEnum = pgEnum("validation_status", asPgEnum(VALIDATION_STATUSES));

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

export const omrProcessingOutbox = pgTable(
  "omr_processing_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ballotId: uuid("ballot_id").notNull(),
    userId: uuid("user_id").notNull(), // NOT NULL is safe: existing migrations use same pattern (see 0003)
    s3Key: text("s3_key").notNull(),
    status: outboxStatusEnum("status").notNull().default("pending").$type<OutboxStatus>(),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    processedAt: ISO8601Timestamp("processed_at", { withTimezone: true }),
    ...timestamps
  },
  (table) => ({
    // Global uniqueness: only one non-terminal request per ballot at a time
    uniqueActiveBallot: uniqueIndex("omr_processing_outbox_active_ballot_idx")
      .on(table.ballotId)
      .where(sql`${table.status} IN ('pending', 'processing')`)
  })
);

// ------------------- ballot_scan_results -------------------

export const ballotScanResults = pgTable(
  "ballot_scan_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .unique()
      .references(() => omrProcessingOutbox.id, { onDelete: "cascade" }),
    ballotId: uuid("ballot_id").notNull(),
    userId: uuid("user_id").notNull(),
    s3Key: text("s3_key").notNull(),
    selections: jsonb("selections").notNull().$type<
      Array<{
        fieldId: string;
        selectedValues: string[];
        confidence: number;
      }>
    >(),
    qrVerified: boolean("qr_verified").notNull(),
    processingMetadata: jsonb("processing_metadata").notNull().$type<{
      markersDetected: boolean;
      alignmentApplied: boolean;
    }>(),
    validationStatus: validationStatusEnum("validation_status")
      .notNull()
      .$type<ValidationStatus>(),
    validationErrors: jsonb("validation_errors").$type<
      Array<{
        fieldId?: string;
        reason: string;
      }>
    >(),
    processedAt: ISO8601Timestamp("processed_at", { withTimezone: true }).notNull(),
    ...timestamps
  },
  (table) => ({
    ballotIdIdx: index("ballot_scan_results_ballot_id_idx").on(table.ballotId),
    userIdCreatedIdx: index("ballot_scan_results_user_created_idx").on(
      table.userId,
      table.createdAt
    )
  })
);
