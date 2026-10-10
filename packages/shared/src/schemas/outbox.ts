import { z } from "zod";

export const ballotGenerationOutboxSchema = z.object({
  id: z.string().uuid(),
  electionId: z.string().uuid(),
  ballotId: z.string().uuid(),
  timestamp: z.string().datetime(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  attempts: z.number().int().min(0),
  lastError: z.string().optional(),
  processedAt: z.string().datetime().optional(),
  batchPdfS3Key: z.string().optional()
});

export type BallotGenerationOutboxEntry = z.infer<typeof ballotGenerationOutboxSchema>;
