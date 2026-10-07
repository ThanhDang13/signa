import { Command } from "@nestjs/cqrs";

export type DeleteClerkCommandPayload = {
  id: string;
};

export type DeleteClerkCommandResult = {
  message: string;
};

export class DeleteClerkCommand extends Command<DeleteClerkCommandResult> {
  constructor(public readonly payload: DeleteClerkCommandPayload) {
    super();
  }
}
