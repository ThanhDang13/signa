import type { ErrorHandler, DispatchResult } from "@signa/dsl-error";
import type { DslError, ErrorLogger } from "@signa/dsl-error";

/**
 * Options for configuring worker error handler retry behavior.
 */
export interface WorkerErrorHandlerOptions {
  /**
   * Whether to signal retry for transient errors.
   * Default: true
   */
  shouldRetry?: boolean;

  /**
   * Error categories that should trigger retry.
   * Default: ["external"]
   */
  retryableCategories?: string[];
}

/**
 * Worker phase error handler.
 * Logs errors and signals retry for transient failures.
 */
export class WorkerErrorHandler implements ErrorHandler<"worker"> {
  readonly phase = "worker" as const;

  private readonly shouldRetry: boolean;
  private readonly retryableCategories: Set<string>;

  constructor(
    private readonly logger: ErrorLogger,
    options: WorkerErrorHandlerOptions = {}
  ) {
    this.shouldRetry = options.shouldRetry !== false;
    this.retryableCategories = new Set(options.retryableCategories || ["external"]);
  }

  /**
   * Handle a worker error by logging at error level.
   * Returns shouldRetry: true for transient errors if configured.
   */
  handle(error: DslError): DispatchResult {
    this.logger.log("error", error.message, {
      phase: "worker",
      code: error.code,
      category: error.category,
      traceId: error.metadata.traceId,
      context: error.context
    });

    const shouldRetry = this.shouldRetry && this.retryableCategories.has(error.category);

    return {
      handled: true,
      shouldRetry
    };
  }
}

/**
 * Factory function to create a worker error handler.
 */
export function createWorkerErrorHandler(
  logger: ErrorLogger,
  options?: WorkerErrorHandlerOptions
): ErrorHandler<"worker"> {
  return new WorkerErrorHandler(logger, options);
}
