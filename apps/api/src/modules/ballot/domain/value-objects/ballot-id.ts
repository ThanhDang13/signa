import { ValueObject } from "@signa/nest-property";
import { createError, defineError } from "@signa/nest-error";
import { v7 as uuidv7, validate } from "uuid";

const INVALID_BALLOT_ID = defineError({
  code: "INVALID_BALLOT_ID",
  category: "validation",
  messageKey: "ballot.id.invalid",
  defaultMessage: "Invalid ballot ID format"
});

export class BallotId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(): BallotId {
    return new BallotId(uuidv7());
  }

  static rehydrate(value: string): BallotId {
    if (!validate(value)) {
      throw createError(INVALID_BALLOT_ID.code);
    }
    return new BallotId(value);
  }

  override toString(): string {
    return this.value;
  }
}
