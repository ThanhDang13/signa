import { z } from "zod";

export const processBallotScanParamsSchema = z.object({
  ballotId: z.string().uuid()
});

export const processBallotScanSchema = z.object({
  s3Key: z.string().min(1)
});

export const processBallotScanResponseSchema = z.object({
  message: z.string(),
  requestId: z.string().uuid()
});
