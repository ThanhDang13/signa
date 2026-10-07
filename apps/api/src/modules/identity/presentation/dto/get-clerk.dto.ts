import { createZodDto } from "@signa/nest-contract";
import { getClerkContract } from "@signa/contracts-http/identity";

export class GetClerkParamsDto extends createZodDto(getClerkContract.params) {}

export class GetClerkOutputDto extends createZodDto(getClerkContract.response) {}
