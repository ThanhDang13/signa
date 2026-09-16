import { createError, defineError } from "@signa/nest-error";

export const INVALID_CREDENTIALS = defineError({
  code: "INVALID_CREDENTIALS",
  category: "auth",
  messageKey: "invalid.credentials",
  defaultMessage: "Invalid email or password",
  contextSchema: (context: { email?: string }) => {
    return typeof context?.email === "string";
  }
});

export const createInvalidCredentialsError = (meta?: { email?: boolean }) =>
  createError(INVALID_CREDENTIALS.code, {
    context: meta
  });
