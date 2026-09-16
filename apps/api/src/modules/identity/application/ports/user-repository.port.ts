import { User } from "@signa/api/modules/identity/domain/entities/user";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface UserRepository {
  existByEmail(email: string): Promise<boolean>;
  findAll(): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
