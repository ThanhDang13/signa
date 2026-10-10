import { createZodDto } from "@signa/nest-contract";
import { listBallotBatchesContract } from "@signa/contracts-http/ballot";

export class ListBallotBatchesParamsDto extends createZodDto(listBallotBatchesContract.params!) {}

export class ListBallotBatchesQueryDto extends createZodDto(listBallotBatchesContract.query!) {}

export class ListBallotBatchesOutputDto extends createZodDto(listBallotBatchesContract.response) {}
