import { z } from "zod";
import { ballotReadModelSchema } from "@signa/shared";

export const getBallotParamsSchema = z.object({
  id: z.string().uuid()
});

export const getBallotResponseSchema = ballotReadModelSchema;
