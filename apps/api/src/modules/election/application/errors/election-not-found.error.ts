import { createError, defineError } from "@signa/nest-error";

export const ELECTION_NOT_FOUND = defineError({
  code: "ELECTION_NOT_FOUND",
  category: "not_found",
  messageKey: "election.not.found",
  defaultMessage: "Election not found"
});

export const createElectionNotFoundError = () => createError(ELECTION_NOT_FOUND.code);
