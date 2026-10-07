import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CreateClerkCommand } from "@signa/api/modules/identity/application/commands/create-clerk.command";
import {
  USER_REPOSITORY,
  type UserRepository
} from "@signa/api/modules/identity/application/ports";
import { createClerkAlreadyExistsError } from "@signa/api/modules/identity/application/errors";
import { PASSWORD_HASHER, type PasswordHasher } from "@signa/api/modules/identity/domain/ports";
import { User } from "@signa/api/modules/identity/domain/entities";
import { Email, Password } from "@signa/api/modules/identity/domain/value-objects";

@CommandHandler(CreateClerkCommand)
export class CreateClerkHandler implements ICommandHandler<CreateClerkCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher
  ) {}

  async execute(command: CreateClerkCommand) {
    const { email, fullname, password } = command.payload;

    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      throw createClerkAlreadyExistsError();
    }

    const user = User.create({
      email: Email.create(email),
      fullname,
      password: await Password.create(password, this.hasher),
      role: "CLERK"
    });

    await this.users.save(user);

    return {
      id: user.id.toString(),
      email: user.email.toString(),
      fullname: user.fullname,
      role: user.role
    };
  }
}
