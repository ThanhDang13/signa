import { createZodDto } from "@signa/nest-contract";
import { createClerkContract } from "@signa/contracts-http/identity";

export class CreateClerkInputDto extends createZodDto(createClerkContract.body) {}

export class CreateClerkOutputDto extends createZodDto(createClerkContract.response) {}
