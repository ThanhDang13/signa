import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ResetClerkPasswordCommand } from "@signa/api/modules/identity/application/commands/reset-clerk-password.command";
import {
  USER_REPOSITORY,
  type UserRepository
} from "@signa/api/modules/identity/application/ports";
import { createClerkNotFoundError } from "@signa/api/modules/identity/application/errors";
import { PASSWORD_HASHER, type PasswordHasher } from "@signa/api/modules/identity/domain/ports";
import { Password } from "@signa/api/modules/identity/domain/value-objects";

@CommandHandler(ResetClerkPasswordCommand)
export class ResetClerkPasswordHandler implements ICommandHandler<ResetClerkPasswordCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher
  ) {}

  async execute(command: ResetClerkPasswordCommand) {
    const { id, password } = command.payload;

    const user = await this.users.findById(id);
    if (!user) {
      throw createClerkNotFoundError();
    }

    user.password = await Password.create(password, this.hasher);

    await this.users.save(user);

    return {
      message: "Clerk password reset successfully"
    };
  }
}
