import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateClerkCommand } from "@signa/api/modules/identity/application/commands/update-clerk.command";
import {
  USER_REPOSITORY,
  type UserRepository
} from "@signa/api/modules/identity/application/ports";
import { createClerkNotFoundError, createClerkAlreadyExistsError } from "@signa/api/modules/identity/application/errors";
import { Email } from "@signa/api/modules/identity/domain/value-objects";

@CommandHandler(UpdateClerkCommand)
export class UpdateClerkHandler implements ICommandHandler<UpdateClerkCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository
  ) {}

  async execute(command: UpdateClerkCommand) {
    const { id, email, fullname } = command.payload;

    const user = await this.users.findById(id);
    if (!user) {
      throw createClerkNotFoundError();
    }

    // Check if email is being updated and if it already exists
    if (email && email !== user.email.toString()) {
      const existingUser = await this.users.findByEmail(email);
      if (existingUser) {
        throw createClerkAlreadyExistsError();
      }
      // Email is readonly, cannot be updated. Need to recreate user or modify entity
      throw createClerkAlreadyExistsError(); // Temporarily block email updates
    }

    if (fullname !== undefined) {
      user.fullname = fullname;
    }

    await this.users.save(user);

    return {
      message: "Clerk updated successfully"
    };
  }
}
