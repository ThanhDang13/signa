import { pgTable, text, uuid, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { BALLOT_STATUSES } from "@signa/shared";
import type { BallotStatus, BallotSignature, BallotLayout } from "@signa/shared";
import { asPgEnum, timestamps, ISO8601Timestamp } from "./helper.schema";
import { elections } from "./elections.schema";

// ------------------- enums -------------------

export const ballotStatusEnum = pgEnum("ballot_status", asPgEnum(Object.values(BALLOT_STATUSES)));

// ------------------- ballots -------------------

export const ballots = pgTable("ballots", {
  id: uuid("id").primaryKey().defaultRandom(),
  electionId: uuid("election_id")
    .notNull()
    .references(() => elections.id, { onDelete: "cascade" }),
  signature: jsonb("signature").notNull().$type<BallotSignature>(),
  status: ballotStatusEnum("status").notNull().default(BALLOT_STATUSES.PENDING).$type<BallotStatus>(),
  pdfS3Key: text("pdf_s3_key"),
  qrCodeData: text("qr_code_data").notNull(),
  layoutMetadata: jsonb("layout_metadata").notNull().$type<BallotLayout>(),
  generatedAt: ISO8601Timestamp("generated_at", { withTimezone: true }),
  ...timestamps
});

// ------------------- relations -------------------

export const ballotsRelations = relations(ballots, ({ one }) => ({
  election: one(elections, {
    fields: [ballots.electionId],
    references: [elections.id]
  })
}));

export const electionsRelations = relations(elections, ({ many }) => ({
  ballots: many(ballots)
}));
