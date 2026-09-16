import { defineError } from "./define-error";

// Validation error codes
export const VALIDATION_FAILED = defineError({
  code: "VALIDATION_FAILED",
  category: "validation",
  messageKey: "validation.failed",
  defaultMessage: "Validation failed"
});

export const SERIALIZATION_ERROR = defineError({
  code: "SERIALIZATION_ERROR",
  category: "internal",
  messageKey: "serialization.error",
  defaultMessage: "Serialization error"
});

export const INVALID_ZOD_STATE = defineError({
  code: "INVALID_ZOD_STATE",
  category: "internal",
  messageKey: "invalid.zod.state",
  defaultMessage: "Invalid Zod state encountered during validation exception mapping"
});
