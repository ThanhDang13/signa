import { Command } from "@nestjs/cqrs";

export type UpdateClerkCommandPayload = {
  id: string;
  email?: string;
  fullname?: string;
};

export type UpdateClerkCommandResult = {
  message: string;
};

export class UpdateClerkCommand extends Command<UpdateClerkCommandResult> {
  constructor(public readonly payload: UpdateClerkCommandPayload) {
    super();
  }
}
