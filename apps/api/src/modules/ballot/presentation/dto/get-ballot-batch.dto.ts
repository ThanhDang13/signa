import { createZodDto } from "@signa/nest-contract";
import { getBallotBatchContract } from "@signa/contracts-http/ballot";

export class GetBallotBatchParamsDto extends createZodDto(getBallotBatchContract.params!) {}

export class GetBallotBatchOutputDto extends createZodDto(getBallotBatchContract.response) {}
