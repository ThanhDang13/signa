import { createError, defineError } from "@signa/nest-error";

export const USER_ALREADY_EXISTS = defineError({
  code: "USER_ALREADY_EXISTS",
  category: "auth",
  messageKey: "user.already.exists",
  defaultMessage: "User with this email already exists"
});

export const createUserAlreadyExistsError = () => createError(USER_ALREADY_EXISTS.code);
