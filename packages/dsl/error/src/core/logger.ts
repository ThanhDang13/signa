import type { ErrorRuntimePhase } from "./runtime-phase";

/**
 * Log severity levels.
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Context information attached to log entries.
 * Includes phase, traceId, and extensible properties.
 */
export interface LogContext {
  phase?: ErrorRuntimePhase;
  traceId?: string;
  [key: string]: unknown;
}

/**
 * Logger interface for structured logging with lifecycle awareness.
 * Implementations should support child loggers with bound context.
 */
export interface ErrorLogger {
  /**
   * Log a message at the specified level with optional context.
   */
  log(level: LogLevel, message: string, context?: LogContext): void;

  /**
   * Log an error with optional context.
   * Typically maps to "error" level but may include stack traces.
   */
  error(error: Error, context?: LogContext): void;

  /**
   * Create a child logger with pre-bound context properties.
   * Useful for adding phase or traceId to all subsequent logs.
   */
  child(bindings: LogContext): ErrorLogger;
}
