import { isAggregatedError, isDslError } from "@signa/dsl-error";
import type { ErrorExposure } from "./error-exposure.interface";

/**
 * Default implementation of ErrorExposure.
 * In dev mode: allows all messages.
 * In prod mode: blocks infrastructure error messages.
 */
export class DefaultErrorExposure implements ErrorExposure {
  constructor(private readonly isDev: boolean) {}

  allowMessage(error: Error): boolean {
    if (this.isDev) return true;

    if (this.isInfraError(error)) return false;

    if (isDslError(error) || isAggregatedError(error)) return true;
    return false;
  }

  allowContext(): boolean {
    return this.isDev;
  }

  private isInfraError(error: Error): boolean {
    const infraPatterns = [
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /ENOTFOUND/i,
      /ECONNRESET/i,
      /SQL/i,
      /Redis/i,
      /Prisma/i,
      /Postgres/i,
      /MongoDB/i,
      /Database/i,
      /Connection/i,
      /Driver/i,
      /Pool/i
    ];

    return infraPatterns.some((pattern) => pattern.test(error.message));
  }
}
