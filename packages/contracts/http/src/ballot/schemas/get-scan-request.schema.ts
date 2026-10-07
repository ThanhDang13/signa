import { z } from "zod";

export const getScanRequestParamsSchema = z.object({
  requestId: z.string().uuid()
});

export const getScanRequestResponseSchema = z.object({
  requestId: z.string().uuid(),
  ballotId: z.string().uuid(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  s3Url: z.string(), // Generated on-demand presigned URL
  createdAt: z.string(),
  updatedAt: z.string(),
  processedAt: z.string().optional(),
  result: z
    .object({
      validationStatus: z.enum([
        "valid",
        "invalid_markers",
        "invalid_qr",
        "invalid_selections",
        "invalid_confidence",
        "rejected_election_closed"
      ]),
      qrVerified: z.boolean(),
      selections: z.array(
        z.object({
          fieldId: z.string(),
          selectedValues: z.array(z.string()),
          confidence: z.number()
        })
      ),
      processingMetadata: z.object({
        markersDetected: z.boolean(),
        alignmentApplied: z.boolean()
      }),
      processedAt: z.string()
    })
    .optional()
});
