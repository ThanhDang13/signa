/**
 * Controls whether error messages should be exposed to clients.
 * Prevents infrastructure details from leaking in production.
 */
export interface ErrorExposure {
  /**
   * Determines if the error message is safe to expose.
   * @param error - The error to evaluate
   * @returns true if the message can be shown, false if it should be masked
   */
  allowMessage(error: Error): boolean;

  /**
   * Determines if the error context is safe to expose.
   * Context may contain internal details useful for debugging but sensitive in production.
   * @param error - The error to evaluate
   * @returns true if the context can be shown, false if it should be omitted
   */
  allowContext(): boolean;
}
