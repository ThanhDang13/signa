import { pgTable, text, uuid, jsonb, pgEnum, integer } from "drizzle-orm/pg-core";
import { ELECTION_STATUSES } from "@signa/shared";
import type { ElectionStatus, FormStructure } from "@signa/shared";
import { asPgEnum, timestamps, ISO8601Timestamp } from "./helper.schema";

// ------------------- enums -------------------

export const electionStatusEnum = pgEnum("election_status", asPgEnum(Object.values(ELECTION_STATUSES)));

// ------------------- elections -------------------

export const elections = pgTable("elections", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  formStructure: jsonb("form_structure").notNull().$type<FormStructure>(),
  status: electionStatusEnum("status").notNull().default(ELECTION_STATUSES.DRAFT).$type<ElectionStatus>(),
  startDate: ISO8601Timestamp("start_date", { withTimezone: true }),
  endDate: ISO8601Timestamp("end_date", { withTimezone: true }),
  maxVoters: integer("max_voters"),
  createdById: uuid("created_by_id").notNull(),
  ...timestamps
});
