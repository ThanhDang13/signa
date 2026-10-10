import { z } from "zod";
import { ballotBatchReadModelSchema } from "@signa/shared";

export const getBallotBatchParamsSchema = z.object({
  batchId: z.string().uuid()
});

export const getBallotBatchResponseSchema = ballotBatchReadModelSchema;
