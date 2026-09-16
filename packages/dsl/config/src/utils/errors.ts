import type { ErrorContext } from "@signa/dsl-error";
import { createError, normalizeZodIssue } from "@signa/dsl-error";
import { CONFIG_INVALID_ENV } from "../core";
import type { ZodError } from "zod";

export function toConfigInvalidENVfromZodError(zodError: ZodError) {
  const issues = zodError.issues.map(normalizeZodIssue);

  const context: ErrorContext = {
    issues
  };

  return createError(CONFIG_INVALID_ENV.code, {
    message: `Config ENV parsing failed with ${issues.length} error(s)`,
    context,
    metadata: {
      source: "zod",
      issueCount: issues.length
    }
  });
}
