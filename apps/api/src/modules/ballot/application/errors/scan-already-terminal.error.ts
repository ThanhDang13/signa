import { createError, defineError } from "@signa/nest-error";

export const SCAN_ALREADY_TERMINAL = defineError({
  code: "SCAN_ALREADY_TERMINAL",
  category: "conflict",
  messageKey: "scan.already.terminal",
  defaultMessage: "A terminal scan request already exists for this ballot. Use retry with the existing request ID."
});

export const createScanAlreadyTerminalError = (requestId: string) =>
  createError(SCAN_ALREADY_TERMINAL.code, { metadata: { requestId } });
