import { createError, defineError } from "@signa/nest-error";

export const ELECTION_NOT_DRAFT = defineError({
  code: "ELECTION_NOT_DRAFT",
  category: "validation",
  messageKey: "election.not.draft",
  defaultMessage: "Election is not in draft status"
});

export const createElectionNotDraftError = () => createError(ELECTION_NOT_DRAFT.code);
