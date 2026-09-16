import type { ErrorHandler, DispatchResult } from "@signa/dsl-error";
import type { DslError, ErrorLogger } from "@signa/dsl-error";

/**
 * Bootstrap phase error handler.
 * Logs fatal errors and signals the application should exit.
 * Never throws - always returns a result indicating exit should occur.
 */
export class BootstrapErrorHandler implements ErrorHandler<"bootstrap"> {
  readonly phase = "bootstrap" as const;

  constructor(private readonly logger: ErrorLogger) {}

  /**
   * Handle a bootstrap error by logging at fatal level.
   * Always returns handled: true, shouldExit: true.
   */
  handle(error: DslError): DispatchResult {
    this.logger.log("fatal", error.message, {
      phase: "bootstrap",
      code: error.code,
      category: error.category,
      traceId: error.metadata.traceId,
      context: error.context
    });

    return {
      handled: true,
      shouldExit: true
    };
  }
}

/**
 * Factory function to create a bootstrap error handler.
 */
export function createBootstrapErrorHandler(logger: ErrorLogger): ErrorHandler<"bootstrap"> {
  return new BootstrapErrorHandler(logger);
}

/**
 * Helper function that handles a bootstrap error and exits the process.
 * This function never returns.
 */
export function handleBootstrapError(error: DslError, logger: ErrorLogger): never {
  const handler = new BootstrapErrorHandler(logger);
  handler.handle(error);
  process.exit(1);
}
