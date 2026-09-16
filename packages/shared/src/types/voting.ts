import type z from "zod";
import type {
  electionIdSchema,
  ballotIdSchema,
  formFieldPositionSchema,
  formFieldSchema,
  formLayoutSchema,
  formStructureSchema,
  ballotSignatureSchema,
  electionStatusSchema,
  ballotStatusSchema,
  ballotLayoutSchema
} from "../schemas/voting";

export type ElectionId$ = z.infer<typeof electionIdSchema>;
export type BallotId$ = z.infer<typeof ballotIdSchema>;

export type FormFieldPosition = z.infer<typeof formFieldPositionSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type FormLayout = z.infer<typeof formLayoutSchema>;
export type FormStructure = z.infer<typeof formStructureSchema>;

export type BallotSignature = z.infer<typeof ballotSignatureSchema>;
export type BallotLayout = z.infer<typeof ballotLayoutSchema>;

export type ElectionStatus = z.infer<typeof electionStatusSchema>;
export type BallotStatus = z.infer<typeof ballotStatusSchema>;
