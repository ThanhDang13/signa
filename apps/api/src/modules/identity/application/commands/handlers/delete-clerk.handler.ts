import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { DeleteClerkCommand } from "@signa/api/modules/identity/application/commands/delete-clerk.command";
import {
  USER_REPOSITORY,
  type UserRepository
} from "@signa/api/modules/identity/application/ports";
import { createClerkNotFoundError } from "@signa/api/modules/identity/application/errors";

@CommandHandler(DeleteClerkCommand)
export class DeleteClerkHandler implements ICommandHandler<DeleteClerkCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository
  ) {}

  async execute(command: DeleteClerkCommand) {
    const { id } = command.payload;

    const user = await this.users.findById(id);
    if (!user) {
      throw createClerkNotFoundError();
    }

    await this.users.delete(id);

    return {
      message: "Clerk deleted successfully"
    };
  }
}
