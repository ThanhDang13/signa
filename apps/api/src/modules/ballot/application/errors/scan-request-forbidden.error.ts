import { createError, defineError } from "@signa/nest-error";

export const SCAN_REQUEST_FORBIDDEN = defineError({
  code: "SCAN_REQUEST_FORBIDDEN",
  category: "forbidden",
  messageKey: "scan.request.forbidden",
  defaultMessage: "You do not have permission to access this scan request"
});

export const createScanRequestForbiddenError = () => createError(SCAN_REQUEST_FORBIDDEN.code);
