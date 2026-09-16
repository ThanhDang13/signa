export const PASSWORD_HASHER = Symbol("PASSWORD_HASHER");

export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  verify(hash: string, plainPassword: string): Promise<boolean>;
}
