import { createError, defineError } from "@signa/nest-error";

export const ELECTION_CANNOT_BE_DELETED = defineError({
  code: "ELECTION_CANNOT_BE_DELETED",
  category: "validation",
  messageKey: "election.cannot.be.deleted",
  defaultMessage: "Election can only be deleted in draft status"
});

export const createElectionCannotBeDeletedError = () => createError(ELECTION_CANNOT_BE_DELETED.code);
