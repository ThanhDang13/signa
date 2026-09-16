import { createZodDto } from "@signa/nest-contract";
import { generateBallotsContract } from "@signa/contracts-http/ballot";

export class GenerateBallotsInputDto extends createZodDto(generateBallotsContract.body) {}

export class GenerateBallotsOutputDto extends createZodDto(generateBallotsContract.response) {}
