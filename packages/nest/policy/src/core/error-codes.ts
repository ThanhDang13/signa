import { defineError } from "@signa/dsl-error";

// Nest policy error codes
export const SUBJECT_RESOLUTION_FAILED = defineError({
  code: "SUBJECT_RESOLUTION_FAILED",
  category: "internal",
  messageKey: "policy.subject.resolution_failed",
  defaultMessage: "Failed to resolve policy subject from request context"
});

export const RESOURCE_RESOLUTION_FAILED = defineError({
  code: "RESOURCE_RESOLUTION_FAILED",
  category: "internal",
  messageKey: "policy.resource.resolution_failed",
  defaultMessage: "Failed to resolve policy resource from request context"
});
