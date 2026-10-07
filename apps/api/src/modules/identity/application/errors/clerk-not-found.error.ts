import { createError, defineError } from "@signa/nest-error";

export const CLERK_NOT_FOUND = defineError({
  code: "CLERK_NOT_FOUND",
  category: "not_found",
  messageKey: "clerk.not.found",
  defaultMessage: "Clerk not found"
});

export const createClerkNotFoundError = () => createError(CLERK_NOT_FOUND.code);
