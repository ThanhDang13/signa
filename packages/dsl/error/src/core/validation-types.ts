import type { ErrorContext } from "./types";

export interface ValidationIssue {
  path: (string | number)[];
  message: string;
  code: string;
  expected?: unknown;
  received?: unknown;
}

export interface ValidationErrorContext extends ErrorContext {
  issues: ValidationIssue[];
  source: "zod" | "class-validator" | "custom";
}

export interface SerializationErrorContext extends ErrorContext {
  issues: ValidationIssue[];
  source: "zod" | "class-validator" | "custom";
}
