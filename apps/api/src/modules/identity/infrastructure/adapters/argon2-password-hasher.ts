import { Injectable } from "@nestjs/common";
import { PasswordHasher } from "@signa/api/modules/identity/domain/ports";
import * as argon2 from "argon2";

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword);
  }

  async verify(hash: string, plainPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainPassword);
    } catch {
      return false;
    }
  }
}
