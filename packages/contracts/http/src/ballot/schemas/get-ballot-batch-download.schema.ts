import { z } from "zod";

export const getBallotBatchDownloadParamsSchema = z.object({
  batchId: z.string().uuid()
});

export const getBallotBatchDownloadResponseSchema = z.object({
  downloadUrl: z.string().url(),
  expiresIn: z.number().int().positive()
});
