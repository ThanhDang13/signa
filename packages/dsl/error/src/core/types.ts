export type ErrorCategory =
  "validation" | "auth" | "forbidden" | "not_found" | "conflict" | "internal" | "external";

export interface ErrorContext {
  [key: string]: unknown;
}

export interface ErrorMetadata {
  timestamp: string;
  traceId?: string;
  [key: string]: unknown;
}

export interface ErrorDefinition<
  TContext extends ErrorContext = ErrorContext,
  TCode extends string = string,
  TMessageKey extends string = string,
  TDefaultMessage extends string = string,
  TCategory extends ErrorCategory = ErrorCategory
> {
  code: TCode;
  category: TCategory;
  messageKey: TMessageKey;
  defaultMessage?: TDefaultMessage;
  contextSchema?: (context: TContext) => boolean;
}

export interface DslError<TContext extends ErrorContext = ErrorContext> {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly messageKey: string;
  readonly message: string;
  readonly context?: TContext;
  readonly metadata: ErrorMetadata;
  readonly cause?: Error | DslError;
  readonly timestamp: string;
}

export interface AggregatedError {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly messageKey: string;
  readonly message: string;
  readonly errors: ReadonlyArray<DslError>;
  readonly metadata: ErrorMetadata;
  readonly timestamp: string;
}
