import type { SerializationErrorContext } from "@signa/dsl-error";
import {
  createError,
  INVALID_ZOD_STATE,
  normalizeZodIssue,
  SERIALIZATION_ERROR,
  toDslValidationErrorFromZodError
} from "@signa/dsl-error";
import { ZodSerializationException, ZodValidationException } from "nestjs-zod";
import { ZodError } from "zod";

export { normalizeZodIssue };
export { isZodError, toDslValidationErrorFromZodError } from "@signa/dsl-error";

export function isZodValidationException(error: unknown): error is ZodValidationException {
  return error instanceof ZodValidationException;
}

export function isZodSerializationException(error: unknown): error is ZodSerializationException {
  return error instanceof ZodSerializationException;
}

function assertZodError(error: unknown): asserts error is ZodError {
  if (!(error instanceof ZodError)) {
    throw createError(INVALID_ZOD_STATE.code);
  }
}

export function toDslSerializationErrorFromZodError(zodError: ZodError) {
  const issues = zodError.issues.map(normalizeZodIssue);

  const context: SerializationErrorContext = {
    issues,
    source: "zod"
  };

  return createError(SERIALIZATION_ERROR.code, {
    message: `Serialization failed with ${issues.length} error(s)`,
    context,
    metadata: {
      source: "zod",
      issueCount: issues.length
    }
  });
}

export function toDslValidationErrorFromZodValidationException(
  zodValidationException: ZodValidationException
) {
  const zodError = zodValidationException.getZodError();
  assertZodError(zodError);
  return toDslValidationErrorFromZodError(zodError);
}

export function toDslSerializationErrorFromZodSerializationException(
  zodSerializationException: ZodSerializationException
) {
  const zodError = zodSerializationException.getZodError();
  assertZodError(zodError);
  return toDslSerializationErrorFromZodError(zodError);
}
