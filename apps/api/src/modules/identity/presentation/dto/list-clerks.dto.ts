import { createZodDto } from "@signa/nest-contract";
import { listClerksContract } from "@signa/contracts-http/identity";

export class ListClerksQueryDto extends createZodDto(listClerksContract.query) {}

export class ListClerksOutputDto extends createZodDto(listClerksContract.response) {}
