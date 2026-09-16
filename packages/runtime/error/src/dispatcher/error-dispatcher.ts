import type {
  ErrorDispatcher,
  ErrorHandler,
  DispatchResult,
  ErrorRuntimePhase
} from "@signa/dsl-error";
import type { DslError } from "@signa/dsl-error";

/**
 * Options for creating an error dispatcher.
 */
export interface ErrorDispatcherOptions {
  /**
   * Default handler to use when no phase-specific handler is registered.
   * If not provided, unhandled errors will return { handled: false }.
   */
  defaultHandler?: ErrorHandler;
}

/**
 * Default error dispatcher implementation.
 * Maintains a registry of handlers by phase and routes errors accordingly.
 */
export class ErrorDispatcherImpl implements ErrorDispatcher {
  private readonly handlers = new Map<ErrorRuntimePhase, ErrorHandler[]>();
  private readonly defaultHandler?: ErrorHandler;

  constructor(options: ErrorDispatcherOptions = {}) {
    this.defaultHandler = options.defaultHandler;
  }

  /**
   * Register a handler for a specific runtime phase.
   * Multiple handlers can be registered for the same phase.
   */
  register<TPhase extends ErrorRuntimePhase, TContext = unknown>(
    handler: ErrorHandler<TPhase, TContext>
  ): void {
    const existing = this.handlers.get(handler.phase) || [];
    this.handlers.set(handler.phase, [...existing, handler as ErrorHandler]);
  }

  /**
   * Dispatch an error to the appropriate handler(s) for the given phase.
   * Returns the aggregated result from all matching handlers.
   */
  async dispatch<TContext = unknown>(
    error: DslError,
    phase: ErrorRuntimePhase,
    context?: TContext
  ): Promise<DispatchResult> {
    const phaseHandlers = this.handlers.get(phase);

    // No phase-specific handlers, try default
    if (!phaseHandlers || phaseHandlers.length === 0) {
      if (this.defaultHandler) {
        return this.defaultHandler.handle(error, context);
      }
      return { handled: false };
    }

    // Execute all handlers for this phase
    const results = await Promise.all(
      phaseHandlers.map((handler) => handler.handle(error, context))
    );

    // Aggregate results: handled if any handler handled it
    // shouldExit if any handler says exit
    // shouldRetry if any handler says retry (and no exit)
    return results.reduce<DispatchResult>(
      (acc, result) => ({
        handled: acc.handled || result.handled,
        shouldExit: acc.shouldExit || result.shouldExit,
        shouldRetry: !result.shouldExit && (acc.shouldRetry || result.shouldRetry)
      }),
      { handled: false }
    );
  }
}

/**
 * Factory function to create an error dispatcher.
 */
export function createErrorDispatcher(options?: ErrorDispatcherOptions): ErrorDispatcher {
  return new ErrorDispatcherImpl(options);
}
