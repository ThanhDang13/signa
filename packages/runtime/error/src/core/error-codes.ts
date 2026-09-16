import { defineError } from "@signa/dsl-error";

export const BOOTSTRAP_ERROR = defineError({
  code: "BOOTSTRAP_ERROR",
  category: "internal",
  messageKey: "bootstrap"
});
