import { ValueObject } from "@signa/nest-property";
import { createInvalidEmailError } from "./errors";

export class Email extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): Email {
    if (!Email.isValid(value)) {
      throw createInvalidEmailError();
    }
    return new Email(value.toLowerCase());
  }

  static rehydrate(value: string): Email {
    return new Email(value);
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  override toString(): string {
    return this.value;
  }
}
