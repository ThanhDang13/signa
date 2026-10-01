/**
 * Error indicating that a job has failed due to a non-retryable error
 * Worker should classify errors and throw this for deterministic failures
 */
export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableError";
  }
}

export function isNonRetryableError(error: unknown): boolean {
  return error instanceof NonRetryableError;
}
