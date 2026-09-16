import { defineError } from "@signa/dsl-error";

// Define policy error codes
export const POLICY_DENIED = defineError({
  code: "POLICY_DENIED",
  category: "forbidden",
  messageKey: "policy.denied",
  defaultMessage: "Policy denied"
});

export const POLICY_EVALUATION_FAILED = defineError({
  code: "POLICY_EVALUATION_FAILED",
  category: "internal",
  messageKey: "policy.evaluation_failed",
  defaultMessage: "Policy evaluation failed"
});
