import { createError, defineError } from "@signa/nest-error";

export const MAX_VOTERS_EXCEEDED = defineError({
  code: "MAX_VOTERS_EXCEEDED",
  category: "validation",
  messageKey: "ballot.max.voters.exceeded",
  defaultMessage: "Cannot generate more ballots than maxVoters limit"
});

export const createMaxVotersExceededError = (current: number, requested: number, max: number) =>
  createError(MAX_VOTERS_EXCEEDED.code, {
    metadata: {
      current,
      requested,
      max,
      available: max - current
    }
  });
