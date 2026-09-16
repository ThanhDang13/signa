import { BOOTSTRAP_ERROR, ConsoleErrorLogger } from "@signa/runtime-error";
import { isDslError, wrapError } from "@signa/nest-error";

export const logger = new ConsoleErrorLogger();

export function toDslError(err: unknown) {
  return isDslError(err)
    ? err
    : wrapError(BOOTSTRAP_ERROR.code, err instanceof Error ? err : new Error(String(err)));
}
