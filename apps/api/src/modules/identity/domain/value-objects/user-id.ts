import { ValueObject } from "@signa/nest-property";
import { UserId$, userIdSchema } from "@signa/shared";
import { v7 as uuidv7 } from "uuid";

export class UserId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(): UserId {
    return new UserId(uuidv7());
  }

  static rehydrate(value: string): UserId {
    return new UserId(value);
  }

  override toString(): UserId$ {
    return userIdSchema.parse(this.value);
  }
}
