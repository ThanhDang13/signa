import { createZodDto } from "@signa/nest-contract";
import { signupContract } from "@signa/contracts-http/identity";

export class SignupInputDto extends createZodDto(signupContract.body) {}

export class SignupOutputDto extends createZodDto(signupContract.response) {}
