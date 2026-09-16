import type { ErrorLogger, LogLevel, LogContext } from "@signa/dsl-error";

/**
 * Zero-dependency console-based error logger.
 * Formats messages with timestamp, level, and context.
 * Suitable for development and environments without structured logging.
 */
export class ConsoleErrorLogger implements ErrorLogger {
  constructor(private readonly bindings: LogContext = {}) {}

  /**
   * Log a message at the specified level with optional context.
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.bindings, ...context };
    const contextStr = this.formatContext(mergedContext);

    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;

    switch (level) {
      case "debug":
      case "info":
        console.log(logLine);
        break;
      case "warn":
        console.warn(logLine);
        break;
      case "error":
      case "fatal":
        console.error(logLine);
        break;
    }
  }

  /**
   * Log an error with optional context.
   * Includes stack trace if available.
   */
  error(error: Error, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.bindings, ...context };
    const contextStr = this.formatContext(mergedContext);

    console.error(`[${timestamp}] [ERROR] ${error.message}${contextStr}\n${error.stack || ""}`);
  }

  /**
   * Create a child logger with pre-bound context properties.
   */
  child(bindings: LogContext): ErrorLogger {
    return new ConsoleErrorLogger({ ...this.bindings, ...bindings });
  }

  /**
   * Format context object as a readable string.
   */
  private formatContext(context: LogContext): string {
    const entries = Object.entries(context);
    if (entries.length === 0) return "";

    const formatted = entries.map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(" ");

    return ` | ${formatted}`;
  }
}

/**
 * Factory function to create a console error logger.
 */
export function createConsoleErrorLogger(bindings?: LogContext): ErrorLogger {
  return new ConsoleErrorLogger(bindings);
}
