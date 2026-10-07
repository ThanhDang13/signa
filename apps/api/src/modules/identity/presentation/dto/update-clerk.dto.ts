import { createZodDto } from "@signa/nest-contract";
import { updateClerkContract } from "@signa/contracts-http/identity";

export class UpdateClerkParamsDto extends createZodDto(updateClerkContract.params) {}

export class UpdateClerkInputDto extends createZodDto(updateClerkContract.body) {}

export class UpdateClerkOutputDto extends createZodDto(updateClerkContract.response) {}
