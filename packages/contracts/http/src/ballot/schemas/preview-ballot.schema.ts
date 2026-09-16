import { z } from "zod";
import { formStructureSchema } from "@signa/shared";

export const previewBallotSchema = z.object({
  electionId: z.string().uuid(),
  formStructure: formStructureSchema
});

export const previewBallotResponseSchema = z.object({
  pdfUrl: z.string().url(),
  expiresAt: z.string().datetime()
});
