import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { InjectDatabase } from "@signa/nest-drizzle";

import * as schemas from "@signa/runtime-drizzle/schemas";
import { User } from "@signa/api/modules/identity/domain/entities";
import { UserRepository } from "@signa/api/modules/identity/application/ports";
import { type DrizzleDatabase } from "@signa/api/core/database/database.config";

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(
    @InjectDatabase()
    private readonly db: DrizzleDatabase
  ) {}

  async findAll(): Promise<User[]> {
    const rows = await this.db.select().from(schemas.users);
    return rows.map((row) =>
      User.rehydrate({
        id: row.id,
        email: row.email,
        fullname: row.fullname,
        passwordHash: row.password,
        avatar: row.avatar,
        bio: row.bio,
        role: row.role,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    );
  }

  async existByEmail(email: string): Promise<boolean> {
    const row = await this.db.query.users.findFirst({
      where: eq(schemas.users.email, email),
      columns: { id: true }
    });
    return !!row;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(schemas.users.id, id)
    });

    if (!row) return null;

    return User.rehydrate({
      id: row.id,
      email: row.email,
      fullname: row.fullname,
      passwordHash: row.password,
      avatar: row.avatar,
      bio: row.bio,
      role: row.role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(schemas.users.email, email)
    });

    if (!row) return null;

    return User.rehydrate({
      id: row.id,
      email: row.email,
      fullname: row.fullname,
      passwordHash: row.password,
      avatar: row.avatar,
      bio: row.bio,
      role: row.role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    });
  }

  async save(user: User): Promise<void> {
    const userId = user.id.toString();

    await this.db
      .insert(schemas.users)
      .values({
        id: userId,
        email: user.email.toString(),
        fullname: user.fullname,
        password: user.password.toString(),
        avatar: user.avatar ?? "",
        bio: user.bio ?? "",
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      })
      .onConflictDoUpdate({
        target: schemas.users.id,
        set: {
          email: user.email.toString(),
          fullname: user.fullname,
          password: user.password.toString(),
          avatar: user.avatar ?? "",
          bio: user.bio ?? "",
          role: user.role,
          updatedAt: user.updatedAt.toISOString()
        }
      });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schemas.users).where(eq(schemas.users.id, id));
  }
}
