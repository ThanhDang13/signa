import { defineJob } from "@signa/dsl-queue-contract";
import { z } from "zod";
import { ballotLayoutSchema } from "@signa/shared";

/**
 * Job: Process ballot scan
 * Detects checkboxes via OMR and verifies QR signature
 */
export const processBallotJob = defineJob({
  queue: "scan",
  job: "process-ballot",
  data: z.object({
    requestId: z.string().uuid(),
    s3Key: z.string(),
    ballotId: z.string().uuid(),
    layout: ballotLayoutSchema
  }),
  result: z.object({
    ballotId: z.string(),
    selections: z.array(
      z.object({
        fieldId: z.string(),
        selectedValues: z.array(z.string()),
        confidence: z.number().min(0).max(1)
      })
    ),
    qrVerified: z.boolean(),
    processingMetadata: z.object({
      markersDetected: z.boolean(),
      alignmentApplied: z.boolean()
    })
  })
});

/**
 * Job: Verify QR signature
 * Validates QR code HMAC signature
 */
export const verifyQrJob = defineJob({
  queue: "scan",
  job: "verify-qr",
  data: z.object({
    qrData: z.string(),
    expectedSignature: z.string()
  }),
  result: z.object({
    valid: z.boolean(),
    ballotId: z.string().optional(),
    formConfigId: z.string().optional()
  })
});
