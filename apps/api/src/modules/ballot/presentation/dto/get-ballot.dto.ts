import { createZodDto } from "@signa/nest-contract";
import { getBallotContract } from "@signa/contracts-http/ballot";

export class GetBallotParamsDto extends createZodDto(getBallotContract.params!) {}

export class GetBallotOutputDto extends createZodDto(getBallotContract.response) {}
