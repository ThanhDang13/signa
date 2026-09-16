import type { ErrorLogger, LogLevel, LogContext } from "@signa/dsl-error";
import type { Logger as PinoLogger } from "pino";

/**
 * Options for creating a Pino error logger.
 */
export interface PinoErrorLoggerOptions {
  /**
   * Whether to serialize DslError instances with their full context.
   * Default: true
   */
  serializeDslError?: boolean;
}

/**
 * Pino-based error logger implementation.
 * Maps ErrorLogger interface to Pino's structured logging API.
 */
export class PinoErrorLogger implements ErrorLogger {
  constructor(
    private readonly pino: PinoLogger,
    private readonly options: PinoErrorLoggerOptions = {}
  ) {}

  /**
   * Log a message at the specified level with optional context.
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    const pinoLevel = this.mapLevel(level);
    this.pino[pinoLevel](context || {}, message);
  }

  /**
   * Log an error with optional context.
   * Serializes DslError instances if configured.
   */
  error(error: Error, context?: LogContext): void {
    const shouldSerialize = this.options.serializeDslError !== false;

    if (shouldSerialize && this.isDslError(error)) {
      this.pino.error(
        {
          ...context,
          err: error,
          code: error.code,
          category: error.category,
          messageKey: error.messageKey,
          errorContext: error.context,
          metadata: error.metadata
        },
        error.message
      );
    } else {
      this.pino.error({ ...context, err: error }, error.message);
    }
  }

  /**
   * Create a child logger with pre-bound context properties.
   */
  child(bindings: LogContext): ErrorLogger {
    return new PinoErrorLogger(this.pino.child(bindings), this.options);
  }

  /**
   * Map ErrorLogger LogLevel to Pino level.
   */
  private mapLevel(level: LogLevel): "debug" | "info" | "warn" | "error" | "fatal" {
    return level;
  }

  /**
   * Type guard to check if an error is a DslError.
   */
  private isDslError(error: Error): error is Error & {
    code: string;
    category: string;
    messageKey: string;
    context?: unknown;
    metadata: unknown;
  } {
    return "code" in error && "category" in error && "messageKey" in error && "metadata" in error;
  }
}

/**
 * Factory function to create a Pino error logger.
 * Requires a Pino logger instance as peer dependency.
 */
export function createPinoErrorLogger(
  pinoInstance: PinoLogger,
  options?: PinoErrorLoggerOptions
): ErrorLogger {
  return new PinoErrorLogger(pinoInstance, options);
}
