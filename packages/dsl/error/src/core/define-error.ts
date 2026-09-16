import type { ErrorDefinition, ErrorContext, ErrorCategory } from "./types";
import { ErrorRegistry } from "./error-registry";

export interface DefineErrorOptions<
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

export function defineError<
  const TCode extends string = string,
  const TMessageKey extends string = string,
  const TDefaultMessage extends string = string,
  TCategory extends ErrorCategory = ErrorCategory,
  TContext extends ErrorContext = ErrorContext
>(
  options: DefineErrorOptions<TContext, TCode, TMessageKey, TDefaultMessage, TCategory>
): ErrorDefinition<TContext, TCode, TMessageKey, TDefaultMessage, TCategory> {
  const definition = {
    code: options.code,
    category: options.category,
    messageKey: options.messageKey,
    defaultMessage: options.defaultMessage,
    contextSchema: options.contextSchema
  } as ErrorDefinition<TContext, TCode, TMessageKey, TDefaultMessage, TCategory>;

  ErrorRegistry.register(definition);

  return definition;
}
