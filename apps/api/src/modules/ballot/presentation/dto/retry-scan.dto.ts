import { createZodDto } from "@signa/nest-contract";
import { retryScanContract } from "@signa/contracts-http/ballot";

export class RetryScanParamsDto extends createZodDto(retryScanContract.params) {}

export class RetryScanInputDto extends createZodDto(retryScanContract.body) {}

export class RetryScanOutputDto extends createZodDto(retryScanContract.response) {}
