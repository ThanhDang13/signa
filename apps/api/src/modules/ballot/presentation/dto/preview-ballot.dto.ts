import { createZodDto } from "@signa/nest-contract";
import { previewBallotContract } from "@signa/contracts-http/ballot";

export class PreviewBallotInputDto extends createZodDto(previewBallotContract.body) {}

export class PreviewBallotOutputDto extends createZodDto(previewBallotContract.response) {}
