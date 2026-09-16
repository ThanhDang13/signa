import type { DslError, ErrorContext } from "./types";
import { createError } from "./create-error";

export function wrapError<TContext extends ErrorContext = ErrorContext>(
  code: string,
  cause: Error | DslError,
  context?: TContext
): DslError<TContext> {
  return createError<TContext>(code, {
    context,
    cause,
    message: cause.message,
    metadata: {
      wrapped: true,
      originalError: cause instanceof Error ? cause.message : undefined
    }
  });
}
