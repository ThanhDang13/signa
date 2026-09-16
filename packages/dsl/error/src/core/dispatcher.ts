import type { DslError } from "./types";
import type { ErrorRuntimePhase } from "./runtime-phase";

/**
 * Result of dispatching an error to a handler.
 * Indicates whether the error was handled and what action to take.
 */
export interface DispatchResult {
  /**
   * Whether the error was successfully handled.
   */
  handled: boolean;

  /**
   * Whether the application should exit after handling.
   * Typically true for fatal bootstrap or shutdown errors.
   */
  shouldExit?: boolean;

  /**
   * Whether the operation should be retried.
   * Useful for transient failures in worker or http phases.
   */
  shouldRetry?: boolean;
}

/**
 * Phase-specific error handler.
 * Handlers are registered per phase and invoked when errors occur.
 */
export interface ErrorHandler<
  TPhase extends ErrorRuntimePhase = ErrorRuntimePhase,
  TContext = unknown
> {
  /**
   * The runtime phase this handler is responsible for.
   */
  readonly phase: TPhase;

  /**
   * Handle an error that occurred during this phase.
   * Returns a result indicating how the error was handled.
   */
  handle(error: DslError, context?: TContext): Promise<DispatchResult> | DispatchResult;
}

/**
 * Central error dispatcher that routes errors to phase-specific handlers.
 * Supports registering multiple handlers per phase and fallback behavior.
 */
export interface ErrorDispatcher {
  /**
   * Register a handler for a specific runtime phase.
   * Multiple handlers can be registered for the same phase.
   */
  register<TPhase extends ErrorRuntimePhase, TContext = unknown>(
    handler: ErrorHandler<TPhase, TContext>
  ): void;

  /**
   * Dispatch an error to the appropriate handler(s) for the given phase.
   * Returns the aggregated result from all matching handlers.
   */
  dispatch<TContext = unknown>(
    error: DslError,
    phase: ErrorRuntimePhase,
    context?: TContext
  ): Promise<DispatchResult>;
}
