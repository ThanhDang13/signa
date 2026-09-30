import { createError, defineError } from "@signa/nest-error";

export const RETRY_NOT_ALLOWED = defineError({
  code: "RETRY_NOT_ALLOWED",
  category: "validation",
  messageKey: "retry.not.allowed",
  defaultMessage: "Retry is not allowed for active or non-terminal scan requests"
});

export const createRetryNotAllowedError = () => createError(RETRY_NOT_ALLOWED.code);
