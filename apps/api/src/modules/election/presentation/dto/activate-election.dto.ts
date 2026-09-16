import { createZodDto } from "@signa/nest-contract";
import { activateElectionContract } from "@signa/contracts-http/election";

export class ActivateElectionParamsDto extends createZodDto(activateElectionContract.params!) {}

export class ActivateElectionOutputDto extends createZodDto(activateElectionContract.response) {}
