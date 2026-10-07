import { createError, defineError } from "@signa/nest-error";

export const CLERK_ALREADY_EXISTS = defineError({
  code: "CLERK_ALREADY_EXISTS",
  category: "conflict",
  messageKey: "clerk.already.exists",
  defaultMessage: "Clerk with this email already exists"
});

export const createClerkAlreadyExistsError = () => createError(CLERK_ALREADY_EXISTS.code);
