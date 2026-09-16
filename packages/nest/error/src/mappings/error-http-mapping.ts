import type { ErrorCategory } from "@signa/dsl-error";
import { HttpStatus } from "@nestjs/common";

export class ErrorHttpMapping {
  private static readonly categoryToStatus: Record<ErrorCategory, HttpStatus> = {
    validation: HttpStatus.BAD_REQUEST,
    auth: HttpStatus.UNAUTHORIZED,
    forbidden: HttpStatus.FORBIDDEN,
    not_found: HttpStatus.NOT_FOUND,
    conflict: HttpStatus.CONFLICT,
    internal: HttpStatus.INTERNAL_SERVER_ERROR,
    external: HttpStatus.BAD_GATEWAY
  };

  static getHttpStatus(category: ErrorCategory): HttpStatus {
    return this.categoryToStatus[category] ?? HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
