import { defineError } from "@signa/dsl-error";

export const USER_MISSING = defineError({
  code: "USER_MISSING",
  category: "auth",
  messageKey: "auth.user.missing",
  defaultMessage: "Authentication required: user not found"
});
