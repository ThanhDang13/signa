import { z } from "zod";
import { ballotSignatureSchema } from "@signa/shared";

export const createBallotSchema = z.object({
  electionId: z.string().uuid(),
  signature: ballotSignatureSchema,
  qrCodeData: z.string(),
  pdfS3Key: z.string().optional()
});

export const createBallotResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string()
});
