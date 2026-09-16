import { createError, defineError } from "@signa/nest-error";

export const BALLOT_NOT_FOUND = defineError({
  code: "BALLOT_NOT_FOUND",
  category: "not_found",
  messageKey: "ballot.not.found",
  defaultMessage: "Ballot not found"
});

export const createBallotNotFoundError = () => createError(BALLOT_NOT_FOUND.code);
