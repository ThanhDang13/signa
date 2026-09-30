import { z } from "zod";
import { electionReadModelSchema } from "@signa/shared";

export const getElectionParamsSchema = z.object({
  id: z.string().uuid()
});

export const getElectionResponseSchema = electionReadModelSchema;
