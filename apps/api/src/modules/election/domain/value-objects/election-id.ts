import { ValueObject } from "@signa/nest-property";
import { createError, defineError } from "@signa/nest-error";
import { v7 as uuidv7, validate } from "uuid";

const INVALID_ELECTION_ID = defineError({
  code: "INVALID_ELECTION_ID",
  category: "validation",
  messageKey: "election.id.invalid",
  defaultMessage: "Invalid election ID format"
});

export class ElectionId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(): ElectionId {
    return new ElectionId(uuidv7());
  }

  static rehydrate(value: string): ElectionId {
    if (!validate(value)) {
      throw createError(INVALID_ELECTION_ID.code);
    }
    return new ElectionId(value);
  }

  override toString(): string {
    return this.value;
  }
}
