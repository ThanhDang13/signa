import type { ErrorDefinition, ErrorContext } from "./types";

export class ErrorRegistry {
  private static definitions = new Map<string, ErrorDefinition<ErrorContext>>();

  static register<TContext extends ErrorContext = ErrorContext>(
    definition: ErrorDefinition<TContext>
  ): void {
    if (this.definitions.has(definition.code)) {
      throw new Error(`Error definition already registered for code: ${definition.code}`);
    }
    this.definitions.set(definition.code, definition as ErrorDefinition<ErrorContext>);
  }

  static get<TContext extends ErrorContext = ErrorContext>(
    code: string
  ): ErrorDefinition<TContext> | undefined {
    return this.definitions.get(code) as ErrorDefinition<TContext> | undefined;
  }

  static has(code: string): boolean {
    return this.definitions.has(code);
  }

  static clear(): void {
    this.definitions.clear();
  }
}
