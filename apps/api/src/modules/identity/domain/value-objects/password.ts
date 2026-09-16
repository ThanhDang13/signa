import { ValueObject } from "@signa/nest-property";
import { PasswordHasher } from "@signa/api/modules/identity/domain/ports";

export class Password extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static async create(plainPassword: string, hasher: PasswordHasher): Promise<Password> {
    const hash = await hasher.hash(plainPassword);
    return new Password(hash);
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  async verify(plainPassword: string, hasher: PasswordHasher): Promise<boolean> {
    return hasher.verify(this.value, plainPassword);
  }

  override toString(): string {
    return this.value;
  }
}
