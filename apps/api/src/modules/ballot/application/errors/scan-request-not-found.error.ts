import { createError, defineError } from "@signa/nest-error";

export const SCAN_REQUEST_NOT_FOUND = defineError({
  code: "SCAN_REQUEST_NOT_FOUND",
  category: "not_found",
  messageKey: "scan.request.not.found",
  defaultMessage: "Scan request not found"
});

export const createScanRequestNotFoundError = () => createError(SCAN_REQUEST_NOT_FOUND.code);
