import { createZodDto } from "@signa/nest-contract";
import { getElectionResultsContract } from "@signa/contracts-http/election";

export class GetElectionResultsParamsDto extends createZodDto(getElectionResultsContract.params!) {}

export class GetElectionResultsOutputDto extends createZodDto(getElectionResultsContract.response) {}
