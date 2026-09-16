import { createZodDto } from "@signa/nest-contract";
import { createElectionContract } from "@signa/contracts-http/election";

export class CreateElectionInputDto extends createZodDto(createElectionContract.body) {}

export class CreateElectionOutputDto extends createZodDto(createElectionContract.response) {}
