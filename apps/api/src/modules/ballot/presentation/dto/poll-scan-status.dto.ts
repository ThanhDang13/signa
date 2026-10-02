import { createZodDto } from "@signa/nest-contract";
import { pollScanStatusContract } from "@signa/contracts-http/ballot";

export class PollScanStatusOutputDto extends createZodDto(pollScanStatusContract.response) {}
