import { Module } from "@nestjs/common";
import { IdentityController } from "@signa/api/modules/identity/presentation/controllers/identity.controller";
import { DrizzleUserRepository } from "@signa/api/modules/identity/infrastructure/persistence/drizzle-user.repository";
import { Argon2PasswordHasher } from "@signa/api/modules/identity/infrastructure/adapters/argon2-password-hasher";
import { USER_REPOSITORY } from "@signa/api/modules/identity/application/ports";
import { PASSWORD_HASHER } from "@signa/api/modules/identity/domain/ports";
import * as CommandHandlers from "@signa/api/modules/identity/application/commands/handlers";

const commandHandlers = Object.values(CommandHandlers);

@Module({
  controllers: [IdentityController],
  providers: [
    ...commandHandlers,
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher }
  ],
  exports: [USER_REPOSITORY]
})
export class IdentityModule {}
