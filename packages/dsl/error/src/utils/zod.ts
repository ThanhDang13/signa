import type { z } from "zod";
import { ZodError } from "zod";
import { createError } from "../core";
import { VALIDATION_FAILED } from "../core";
import type { ValidationIssue, ValidationErrorContext } from "../core";

export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

export function normalizeZodIssue(issue: z.core.$ZodIssue): ValidationIssue {
  return {
    path: issue.path.filter((p): p is string | number => typeof p !== "symbol"),
    message: issue.message,
    code: issue.code,
    expected: "expected" in issue ? issue.expected : undefined,
    received: "received" in issue ? issue.received : undefined
  };
}

export function toDslValidationErrorFromZodError(zodError: ZodError) {
  const issues = zodError.issues.map(normalizeZodIssue);

  const context: ValidationErrorContext = {
    issues,
    source: "zod"
  };

  return createError(VALIDATION_FAILED.code, {
    message: `Validation failed with ${issues.length} error(s)`,
    context,
    metadata: {
      source: "zod",
      issueCount: issues.length
    }
  });
}
