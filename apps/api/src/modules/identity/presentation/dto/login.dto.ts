import { createZodDto } from "@signa/nest-contract";
import { loginContract } from "@signa/contracts-http/identity";

export class LoginInputDto extends createZodDto(loginContract.body) {}

export class LoginOutputDto extends createZodDto(loginContract.response) {}
