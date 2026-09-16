import type { DslError, AggregatedError, ErrorMetadata } from "./types";

export class AggregatedErrorImpl extends Error implements AggregatedError {
  readonly code: string = "AGGREGATED_ERROR";
  readonly category = "validation" as const;
  readonly messageKey: string = "errors.aggregated";
  readonly errors: ReadonlyArray<DslError>;
  readonly metadata: ErrorMetadata;
  readonly timestamp: string;

  constructor(errors: ReadonlyArray<DslError>, message?: string) {
    const defaultMessage = message ?? `Multiple errors occurred (${errors.length} errors)`;
    super(defaultMessage);
    this.name = "AggregatedError";
    this.errors = errors;
    this.timestamp = new Date().toISOString();
    this.metadata = {
      timestamp: this.timestamp,
      errorCount: errors.length,
      errorCodes: errors.map((e) => e.code)
    };

    Object.setPrototypeOf(this, AggregatedErrorImpl.prototype);
  }
}

export function aggregateErrors(
  errors: ReadonlyArray<DslError>,
  message?: string
): AggregatedError {
  if (errors.length === 0) {
    throw new Error("Cannot aggregate zero errors");
  }

  return new AggregatedErrorImpl(errors, message);
}
