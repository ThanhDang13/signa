import { Command } from "@nestjs/cqrs";

export type ResetClerkPasswordCommandPayload = {
  id: string;
  password: string;
};

export type ResetClerkPasswordCommandResult = {
  message: string;
};

export class ResetClerkPasswordCommand extends Command<ResetClerkPasswordCommandResult> {
  constructor(public readonly payload: ResetClerkPasswordCommandPayload) {
    super();
  }
}
