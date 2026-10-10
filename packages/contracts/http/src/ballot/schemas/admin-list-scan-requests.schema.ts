import { z } from "zod";
import { createPaginationQuerySchema, paginatedResponseSchema } from "@signa/shared";

export const scanRequestReadModelSchema = z.object({
  requestId: z.string().uuid(),
  ballotId: z.string().uuid(),
  electionId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.string(),
  validationStatus: z
    .enum([
      "valid",
      "invalid_markers",
      "invalid_qr",
      "invalid_selections",
      "invalid_confidence",
      "rejected_election_closed"
    ])
    .nullable(),
  qrVerified: z.boolean().nullable(),
  s3Url: z.string().optional(),
  selections: z
    .array(
      z.object({
        fieldId: z.string(),
        selectedValues: z.array(z.string()),
        confidence: z.number()
      })
    )
    .nullable(),
  processedAt: z.string().nullable(),
  createdAt: z.string()
});

export const adminListScanRequestsQuerySchema = createPaginationQuerySchema({
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  electionId: z.string().uuid().optional()
});

export const adminListScanRequestsResponseSchema = paginatedResponseSchema(scanRequestReadModelSchema);
