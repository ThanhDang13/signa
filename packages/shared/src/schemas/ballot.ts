import { z } from "zod";
import { ballotStatusSchema, ballotSignatureSchema, ballotLayoutSchema } from "./voting";

/**
 * Ballot read model schema - used across application and HTTP layer
 */
export const ballotReadModelSchema = z.object({
  id: z.string().uuid(),
  electionId: z.string().uuid(),
  signature: ballotSignatureSchema,
  status: ballotStatusSchema,
  pdfS3Key: z.string().optional(),
  qrCodeData: z.string(),
  layoutMetadata: ballotLayoutSchema,
  generatedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
});

/**
 * Ballot batch read model schema - for ballot generation tracking
 */
export const ballotBatchReadModelSchema = z.object({
  id: z.string().uuid(),
  electionId: z.string().uuid(),
  count: z.number().int().positive(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  batchPdfS3Key: z.string().optional(),
  lastError: z.string().optional(),
  createdAt: z.iso.datetime(),
  processedAt: z.iso.datetime().optional()
});
