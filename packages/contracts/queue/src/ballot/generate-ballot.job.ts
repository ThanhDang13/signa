import { defineJob } from "@signa/dsl-queue-contract";
import { z } from "zod";
import { ballotSignatureSchema, formStructureSchema, ballotLayoutSchema } from "@signa/shared";

const ballotItemSchema = z.object({
  ballotId: z.string().uuid(),
  signature: ballotSignatureSchema
});

export const generateBallotJob = defineJob({
  queue: "ballot-generation",
  job: "generate-ballot",
  data: z.object({
    electionId: z.string().uuid(),
    timestamp: z.string().datetime(),
    formStructure: formStructureSchema,
    ballots: z.array(ballotItemSchema).min(1)
  }),
  result: z.object({
    batchPdfS3Key: z.string(),
    ballots: z.array(
      z.object({
        ballotId: z.string().uuid(),
        signature: ballotSignatureSchema,
        qrCodeData: z.string(),
        layout: ballotLayoutSchema,
        pageNumber: z.number().int().positive()
      })
    )
  })
});
