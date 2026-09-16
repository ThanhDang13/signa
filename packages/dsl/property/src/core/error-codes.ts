import { defineError } from "@signa/dsl-error";

// Property error codes
export const PROPERTY_NOT_INITIALIZED = defineError({
  code: "PROPERTY_NOT_INITIALIZED",
  category: "internal",
  messageKey: "property.not_initialized",
  defaultMessage: "Property has not been initialized"
});

export const PROPERTY_READONLY = defineError({
  code: "PROPERTY_READONLY",
  category: "validation",
  messageKey: "property.readonly",
  defaultMessage: "Cannot assign to readonly property"
});
