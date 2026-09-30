import { createError, defineError } from "@signa/nest-error";

export const SCAN_ALREADY_ACTIVE = defineError({
  code: "SCAN_ALREADY_ACTIVE",
  category: "conflict",
  messageKey: "scan.already.active",
  defaultMessage: "A scan request for this ballot is already pending or processing"
});

export const createScanAlreadyActiveError = () => createError(SCAN_ALREADY_ACTIVE.code);
