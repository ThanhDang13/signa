import { createError, defineError } from "@signa/nest-error";

export const INVALID_ELECTION_STATUS = defineError({
  code: "INVALID_ELECTION_STATUS",
  category: "validation",
  messageKey: "election.invalid.status",
  defaultMessage: "Invalid election status transition"
});

export const createInvalidElectionStatusError = () => createError(INVALID_ELECTION_STATUS.code);
