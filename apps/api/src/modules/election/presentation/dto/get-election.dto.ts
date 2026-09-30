import { createZodDto } from "@signa/nest-contract";
import { getElectionContract } from "@signa/contracts-http/election";

export class GetElectionParamsDto extends createZodDto(getElectionContract.params!) {}

export class GetElectionOutputDto extends createZodDto(getElectionContract.response) {}
