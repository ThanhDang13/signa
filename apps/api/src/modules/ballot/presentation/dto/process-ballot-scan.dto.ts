import { createZodDto } from "@signa/nest-contract";
import { processBallotScanContract } from "@signa/contracts-http/ballot";

export class ProcessBallotScanParamsDto extends createZodDto(processBallotScanContract.params) {}

export class ProcessBallotScanInputDto extends createZodDto(processBallotScanContract.body) {}

export class ProcessBallotScanOutputDto extends createZodDto(processBallotScanContract.response) {}
