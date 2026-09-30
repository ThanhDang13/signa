import z from "zod";
import {
  ELECTION_STATUSES,
  BALLOT_STATUSES,
  FIELD_TYPES,
  PROCESSING_METHODS
} from "../constants/voting";

// ------------------- IDs -------------------

export const electionIdSchema = z.string().brand("ElectionId");
export const ballotIdSchema = z.string().brand("BallotId");

// ------------------- Form Structure -------------------

export const formFieldPositionSchema = z.object({
  x: z.number().describe("mm from left"),
  y: z.number().describe("mm from top"),
  width: z.number().describe("mm"),
  height: z.number().describe("mm")
});

export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum([FIELD_TYPES.CHECKBOX, FIELD_TYPES.RADIO, FIELD_TYPES.TEXT]),
  method: z.enum([PROCESSING_METHODS.OMR, PROCESSING_METHODS.OCR]),
  label: z.string(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  position: formFieldPositionSchema,
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const formLayoutSchema = z.object({
  pageWidth: z.number().describe("mm (A4 = 210)"),
  pageHeight: z.number().describe("mm (A4 = 297)"),
  margins: z.object({
    top: z.number().describe("mm"),
    right: z.number().describe("mm"),
    bottom: z.number().describe("mm"),
    left: z.number().describe("mm")
  })
});

export const formStructureSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema),
  layout: formLayoutSchema
});

// ------------------- Ballot Layout (OMR) -------------------

export const markerPositionSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const rectanglePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number()
});

export const checkboxPositionSchema = rectanglePositionSchema;

export const ballotFieldOptionSchema = z.object({
  value: z.string(),
  omr: checkboxPositionSchema
});

export const ballotFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  options: z.array(ballotFieldOptionSchema),
  // Validation rules for result processing (optional during compatibility transition)
  type: z.enum([FIELD_TYPES.CHECKBOX, FIELD_TYPES.RADIO, FIELD_TYPES.TEXT]).optional(),
  required: z.boolean().optional(),
  method: z.enum([PROCESSING_METHODS.OMR, PROCESSING_METHODS.OCR]).optional()
});

export const ballotLayoutSchema = z.object({
  pageWidth: z.number(),
  pageHeight: z.number(),
  markers: z.object({
    topLeft: markerPositionSchema,
    topRight: markerPositionSchema,
    bottomLeft: markerPositionSchema,
    bottomRight: markerPositionSchema
  }),
  qrCode: rectanglePositionSchema,
  fields: z.array(ballotFieldSchema)
});

// ------------------- Ballot -------------------

export const ballotSignatureSchema = z.object({
  signature: z.string().describe("HMAC signature"),
  timestamp: z.iso.datetime().describe("ISO8601")
});

// ------------------- Enums -------------------

export const electionStatusSchema = z.enum([
  ELECTION_STATUSES.DRAFT,
  ELECTION_STATUSES.ACTIVE,
  ELECTION_STATUSES.CLOSED,
  ELECTION_STATUSES.ARCHIVED
]);

export const ballotStatusSchema = z.enum([BALLOT_STATUSES.PENDING, BALLOT_STATUSES.VOTED]);
