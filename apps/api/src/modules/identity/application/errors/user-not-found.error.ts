import { createError, defineError } from "@signa/nest-error";

export const USER_NOT_FOUND = defineError({
  code: "USER_NOT_FOUND",
  category: "auth",
  messageKey: "user.not.found",
  defaultMessage: "User not found"
});

export const createUserNotFoundError = () => createError(USER_NOT_FOUND.code);
