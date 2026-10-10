import { createError, defineError } from "@signa/nest-error";

export const BALLOT_BATCH_PDF_NOT_READY = defineError({
  code: "BALLOT_BATCH_PDF_NOT_READY",
  category: "validation",
  messageKey: "ballot.batch.pdf.not.ready",
  defaultMessage: "Batch PDF is not yet available"
});

export const createBallotBatchPdfNotReadyError = () => createError(BALLOT_BATCH_PDF_NOT_READY.code);
