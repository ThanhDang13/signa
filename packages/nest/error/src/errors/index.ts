import { defineError } from "@signa/dsl-error";

export const INTERNAL_ERROR = defineError({
  code: "INTERNAL_ERROR",
  category: "internal",
  messageKey: "errors.internal",
  defaultMessage: "Something went wrong"
});
