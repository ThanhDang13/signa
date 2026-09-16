import type { DslError, ErrorContext } from "./types";

export type ErrorMapper<
  TFromContext extends ErrorContext = ErrorContext,
  TToContext extends ErrorContext = ErrorContext
> = (error: DslError<TFromContext>) => DslError<TToContext>;

export function mapError<
  TFromContext extends ErrorContext = ErrorContext,
  TToContext extends ErrorContext = ErrorContext
>(
  error: DslError<TFromContext>,
  mapper: ErrorMapper<TFromContext, TToContext>
): DslError<TToContext> {
  return mapper(error);
}
