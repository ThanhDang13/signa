import { createZodDto } from "@signa/nest-contract";
import { resetClerkPasswordContract } from "@signa/contracts-http/identity";

export class ResetClerkPasswordParamsDto extends createZodDto(resetClerkPasswordContract.params) {}

export class ResetClerkPasswordInputDto extends createZodDto(resetClerkPasswordContract.body) {}

export class ResetClerkPasswordOutputDto extends createZodDto(resetClerkPasswordContract.response) {}
