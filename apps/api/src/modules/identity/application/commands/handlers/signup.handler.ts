import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { SignupCommand } from "@signa/api/modules/identity/application/commands";
import { TOKEN_SERVICE, type TokenService } from "@signa/nest-jwt";
import {
  USER_REPOSITORY,
  type UserRepository
} from "@signa/api/modules/identity/application/ports";
import { createUserAlreadyExistsError } from "@signa/api/modules/identity/application/errors";
import { PASSWORD_HASHER, type PasswordHasher } from "@signa/api/modules/identity/domain/ports";
import { User } from "@signa/api/modules/identity/domain/entities";
import { Email, Password } from "@signa/api/modules/identity/domain/value-objects";

@CommandHandler(SignupCommand)
export class SignupHandler implements ICommandHandler<SignupCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService
  ) {}

  async execute(command: SignupCommand) {
    const { email, fullname, password } = command.payload;

    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      throw createUserAlreadyExistsError();
    }

    const user = User.create({
      email: Email.create(email),
      fullname,
      password: await Password.create(password, this.hasher),
      role: "CLERK"
    });

    await this.users.save(user);

    const accessToken = await this.tokens.sign({ id: user.id.toString(), roles: [user.role] });
    return {
      accessToken,
      refreshToken: "temporary-refresh-token"
    };
  }
}
