import { createError, defineError } from "@signa/nest-error";

export const BALLOT_BATCH_NOT_FOUND = defineError({
  code: "BALLOT_BATCH_NOT_FOUND",
  category: "not_found",
  messageKey: "ballot.batch.not.found",
  defaultMessage: "Ballot batch not found"
});

export const createBallotBatchNotFoundError = () => createError(BALLOT_BATCH_NOT_FOUND.code);
