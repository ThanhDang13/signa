import type { DslError, AggregatedError } from "@signa/dsl-error";
import { isDslError, isAggregatedError } from "@signa/dsl-error";
import { Injectable } from "@nestjs/common";
import { ErrorHttpMapping } from "../mappings/error-http-mapping";
import type { HttpStatus } from "@nestjs/common";

@Injectable()
export class ErrorMapperService {
  getHttpStatus(error: DslError | AggregatedError | Error): HttpStatus {
    if (isDslError(error) || isAggregatedError(error)) {
      return ErrorHttpMapping.getHttpStatus(error.category);
    }

    return 500;
  }
}
