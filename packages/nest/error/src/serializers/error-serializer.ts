import { Inject, Injectable } from "@nestjs/common";
import { isAggregatedError } from "@signa/dsl-error";
import type { DslError, AggregatedError, ErrorContext } from "@signa/dsl-error";
import { ERROR_EXPOSURE, type ErrorExposure } from "../exposure";

export interface SerializedError {
  code: string;
  category: string;
  message: string;
  messageKey: string;
  context?: Record<string, unknown>;
  metadata: {
    timestamp: string;
    traceId?: string;
  };
  errors?: SerializedError[];
}

@Injectable()
export class ErrorSerializer {
  constructor(@Inject(ERROR_EXPOSURE) private readonly exposure: ErrorExposure) {}

  serialize(error: DslError | AggregatedError, traceId?: string): SerializedError {
    if (isAggregatedError(error)) {
      return this.serializeAggregated(error, traceId);
    }
    return this.serializeDsl(error, traceId);
  }

  private serializeDsl(error: DslError<ErrorContext>, traceId?: string): SerializedError {
    return {
      code: error.code,
      category: error.category,
      message: error.message,
      messageKey: error.messageKey,
      context: this.exposure.allowContext() ? this.sanitizeContext(error.context) : undefined,
      metadata: {
        timestamp: error.timestamp,
        traceId: traceId ?? error.metadata.traceId
      }
    };
  }

  private serializeAggregated(error: AggregatedError, traceId?: string): SerializedError {
    return {
      code: error.code,
      category: error.category,
      message: error.message,
      messageKey: error.messageKey,
      metadata: {
        timestamp: error.timestamp,
        traceId: traceId ?? error.metadata.traceId
      },
      errors: error.errors.map((e) => this.serializeDsl(e, traceId))
    };
  }

  private sanitizeContext(context?: ErrorContext): Record<string, unknown> | undefined {
    if (!context) return undefined;

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ["password", "token", "secret", "apiKey", "authorization"];

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
