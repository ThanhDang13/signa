import { createError, defineError } from "@signa/nest-error";

export const INVALID_EMAIL = defineError({
  code: "INVALID_EMAIL",
  category: "validation",
  messageKey: "email.invalid.format",
  defaultMessage: "Invalid email format"
});

export const createInvalidEmailError = () => createError(INVALID_EMAIL.code);
