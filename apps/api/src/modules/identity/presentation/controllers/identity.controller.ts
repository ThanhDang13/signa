import { Body, Controller, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CommandBus } from "@nestjs/cqrs";
import { ContractRoute, Response } from "@signa/nest-contract";
import { loginContract, signupContract } from "@signa/contracts-http/identity";
import { LoginCommand } from "@signa/api/modules/identity/application/commands/login.command";
import { SignupCommand } from "@signa/api/modules/identity/application/commands/signup.command";
import {
  LoginInputDto,
  LoginOutputDto
} from "@signa/api/modules/identity/presentation/dto/login.dto";
import {
  SignupInputDto,
  SignupOutputDto
} from "@signa/api/modules/identity/presentation/dto/signup.dto";

const LoginRoute = ContractRoute(loginContract, {
  summary: "User login"
});

const SignupRoute = ContractRoute(signupContract, {
  summary: "User registration"
});

@ApiTags("AUTH")
@Controller()
export class IdentityController {
  constructor(private readonly commandBus: CommandBus) {}

  @LoginRoute
  @Response({ type: LoginOutputDto })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginInputDto) {
    return this.commandBus.execute(
      new LoginCommand({
        email: dto.email,
        password: dto.password
      })
    );
  }

  @SignupRoute
  @HttpCode(HttpStatus.OK)
  @Response({ type: SignupOutputDto })
  async signup(@Body() dto: SignupInputDto) {
    return this.commandBus.execute(
      new SignupCommand({
        email: dto.email,
        fullname: dto.fullname,
        password: dto.password
      })
    );
  }
}
