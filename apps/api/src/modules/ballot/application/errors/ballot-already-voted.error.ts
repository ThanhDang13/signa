import { createError, defineError } from "@signa/nest-error";

export const BALLOT_ALREADY_VOTED = defineError({
  code: "BALLOT_ALREADY_VOTED",
  category: "conflict",
  messageKey: "ballot.already.voted",
  defaultMessage: "Ballot has already been voted"
});

export const createBallotAlreadyVotedError = () => createError(BALLOT_ALREADY_VOTED.code);
