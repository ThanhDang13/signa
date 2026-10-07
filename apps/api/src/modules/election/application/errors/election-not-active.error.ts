import { createError, defineError } from "@signa/nest-error";

export const ELECTION_NOT_ACTIVE = defineError({
  code: "ELECTION_NOT_ACTIVE",
  category: "validation",
  messageKey: "election.not.active",
  defaultMessage: "Election is not active"
});

export const createElectionNotActiveError = () => createError(ELECTION_NOT_ACTIVE.code);
