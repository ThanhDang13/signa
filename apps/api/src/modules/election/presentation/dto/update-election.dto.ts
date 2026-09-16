import { createZodDto } from "@signa/nest-contract";
import { updateElectionContract } from "@signa/contracts-http/election";

export class UpdateElectionParamsDto extends createZodDto(updateElectionContract.params!) {}

export class UpdateElectionInputDto extends createZodDto(updateElectionContract.body) {}

export class UpdateElectionOutputDto extends createZodDto(updateElectionContract.response) {}
