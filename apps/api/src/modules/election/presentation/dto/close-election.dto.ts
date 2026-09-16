import { createZodDto } from "@signa/nest-contract";
import { closeElectionContract } from "@signa/contracts-http/election";

export class CloseElectionParamsDto extends createZodDto(closeElectionContract.params!) {}

export class CloseElectionOutputDto extends createZodDto(closeElectionContract.response) {}
