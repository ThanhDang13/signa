import { createZodDto } from "@signa/nest-contract";
import { deleteClerkContract } from "@signa/contracts-http/identity";

export class DeleteClerkParamsDto extends createZodDto(deleteClerkContract.params) {}

export class DeleteClerkOutputDto extends createZodDto(deleteClerkContract.response) {}
