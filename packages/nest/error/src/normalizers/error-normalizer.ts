import {
  AggregatedError,
  createError,
  DslError,
  isAggregatedError,
  isDslError,
  isZodError,
  toDslValidationErrorFromZodError
} from "@signa/dsl-error";
import { Inject, Injectable } from "@nestjs/common";
import { ERROR_EXPOSURE, type ErrorExposure } from "../exposure";
import {
  isZodSerializationException,
  isZodValidationException,
  toDslSerializationErrorFromZodSerializationException,
  toDslValidationErrorFromZodValidationException
} from "../mappers/zod-error-mapper";

@Injectable()
export class ErrorNormalizer {
  constructor(@Inject(ERROR_EXPOSURE) private readonly exposure: ErrorExposure) {}

  normalize(error: Error): DslError | AggregatedError {
    if (isAggregatedError(error)) return error;
    if (isDslError(error)) return error;
    if (isZodError(error)) return toDslValidationErrorFromZodError(error);
    if (isZodValidationException(error))
      return toDslValidationErrorFromZodValidationException(error);
    if (isZodSerializationException(error))
      return toDslSerializationErrorFromZodSerializationException(error);

    const message = this.exposure.allowMessage(error) ? error.message : "Something went wrong";

    return createError("INTERNAL_ERROR", { message });
  }
}
