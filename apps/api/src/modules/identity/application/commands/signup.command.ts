import { Command } from "@nestjs/cqrs";

export type SignupCommandPayload = {
  email: string;
  fullname: string;
  password: string;
};

export type SignupCommandResult = {
  accessToken: string;
  refreshToken: string;
};

export class SignupCommand extends Command<SignupCommandResult> {
  constructor(public readonly payload: SignupCommandPayload) {
    super();
  }
}
