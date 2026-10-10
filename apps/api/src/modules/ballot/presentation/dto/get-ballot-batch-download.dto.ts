import { createZodDto } from "@signa/nest-contract";
import { getBallotBatchDownloadContract } from "@signa/contracts-http/ballot";

export class GetBallotBatchDownloadParamsDto extends createZodDto(
  getBallotBatchDownloadContract.params!
) {}

export class GetBallotBatchDownloadOutputDto extends createZodDto(
  getBallotBatchDownloadContract.response
) {}
