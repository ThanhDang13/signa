import { createZodDto } from "@signa/nest-contract";
import { deleteElectionContract } from "@signa/contracts-http/election";

export class DeleteElectionParamsDto extends createZodDto(deleteElectionContract.params!) {}

export class DeleteElectionOutputDto extends createZodDto(deleteElectionContract.response) {}
