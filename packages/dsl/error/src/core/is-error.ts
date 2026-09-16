import type { DslError, AggregatedError } from "./types";

export function isDslError(value: unknown): value is DslError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "category" in value &&
    "messageKey" in value &&
    "metadata" in value &&
    "timestamp" in value
  );
}

export function isAggregatedError(value: unknown): value is AggregatedError {
  return isDslError(value) && "errors" in value && Array.isArray((value as AggregatedError).errors);
}
