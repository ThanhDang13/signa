import { createZodDto } from "@signa/nest-contract";
import { listBallotsContract } from "@signa/contracts-http/ballot";

export class ListBallotsQueryDto extends createZodDto(listBallotsContract.query!) {}

export class ListBallotsOutputDto extends createZodDto(listBallotsContract.response) {}
