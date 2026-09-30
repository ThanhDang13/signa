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
