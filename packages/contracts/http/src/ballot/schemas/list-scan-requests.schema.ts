import { z } from "zod";

export const listScanRequestsQuerySchema = z.object({
  pageIndex: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional()
});

export const listScanRequestsResponseSchema = z.object({
  items: z.array(
    z.object({
      requestId: z.string().uuid(),
      ballotId: z.string().uuid(),
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
    })
  ),
  pageIndex: z.number(),
  pageSize: z.number(),
  total: z.number()
});
