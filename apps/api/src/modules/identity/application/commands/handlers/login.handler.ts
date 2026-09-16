import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { LoginCommand } from "@signa/api/modules/identity/application/commands";

import { TOKEN_SERVICE, type TokenService } from "@signa/nest-jwt";
import {
  USER_REPOSITORY,
  type UserRepository
} from "@signa/api/modules/identity/application/ports";
import { createInvalidCredentialsError } from "@signa/api/modules/identity/application/errors";
import { PASSWORD_HASHER, type PasswordHasher } from "@signa/api/modules/identity/domain/ports";

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService
  ) {}

  async execute(command: LoginCommand) {
    const { email, password } = command.payload;
    const user = await this.users.findByEmail(email);

    if (!user) {
      throw createInvalidCredentialsError();
    }

    const isValid = await user.password.verify(password, this.hasher);

    if (!isValid) {
      throw createInvalidCredentialsError();
    }

    const accessToken = await this.tokens.sign({
      id: user.id.toString(),
      roles: [user.role]
    });
    return {
      accessToken,
      refreshToken: "temporary-refresh-token"
    };
  }
}
