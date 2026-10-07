import { Command } from "@nestjs/cqrs";

export type CreateClerkCommandPayload = {
  email: string;
  fullname: string;
  password: string;
};

export type CreateClerkCommandResult = {
  id: string;
  email: string;
  fullname: string;
  role: string;
};

export class CreateClerkCommand extends Command<CreateClerkCommandResult> {
  constructor(public readonly payload: CreateClerkCommandPayload) {
    super();
  }
}
