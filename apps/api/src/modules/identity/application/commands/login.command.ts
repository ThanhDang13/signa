import { Command } from "@nestjs/cqrs";

export type LoginCommandPayload = {
  email: string;
  password: string;
};

export type LoginCommandResult = {
  accessToken: string;
  refreshToken: string;
};

export class LoginCommand extends Command<LoginCommandResult> {
  constructor(public readonly payload: LoginCommandPayload) {
    super();
  }
}
