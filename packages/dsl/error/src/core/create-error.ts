import type { DslError, ErrorContext, ErrorMetadata, ErrorCategory } from "./types";
import { ErrorRegistry } from "./error-registry";

export interface CreateErrorOptions<TContext extends ErrorContext = ErrorContext> {
  context?: TContext;
  cause?: Error | DslError;
  metadata?: Partial<ErrorMetadata>;
  message?: string;
}

export class DslErrorImpl<TContext extends ErrorContext = ErrorContext>
  extends Error
  implements DslError<TContext>
{
  readonly code: string;
  readonly category: ErrorCategory;
  readonly messageKey: string;
  readonly context?: TContext;
  readonly metadata: ErrorMetadata;
  override readonly cause?: Error | DslError;
  readonly timestamp: string;

  constructor(
    code: string,
    category: ErrorCategory,
    messageKey: string,
    message: string,
    options?: CreateErrorOptions<TContext>
  ) {
    super(message);
    this.name = "DslError";
    this.code = code;
    this.category = category;
    this.messageKey = messageKey;
    this.context = options?.context;
    this.cause = options?.cause;
    this.timestamp = new Date().toISOString();
    this.metadata = {
      timestamp: this.timestamp,
      ...options?.metadata
    };

    Object.setPrototypeOf(this, DslErrorImpl.prototype);
  }
}

export function createError<
  TContext extends ErrorContext = ErrorContext,
  TCode extends string = string
>(code: TCode, options?: CreateErrorOptions<TContext>): DslError<TContext> {
  const definition = ErrorRegistry.get<TContext>(code);

  if (!definition) {
    throw new Error(`Error definition not found for code: ${code}`);
  }

  if (definition.contextSchema && options?.context) {
    const isValid = definition.contextSchema(options.context);
    if (!isValid) {
      throw new Error(`Invalid context for error code: ${code}`);
    }
  }

  const message = options?.message ?? definition.defaultMessage ?? definition.messageKey;

  return new DslErrorImpl<TContext>(
    definition.code,
    definition.category,
    definition.messageKey,
    message,
    options
  );
}
