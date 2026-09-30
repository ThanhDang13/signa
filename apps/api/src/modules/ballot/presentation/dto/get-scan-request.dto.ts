import { createZodDto } from "@signa/nest-contract";
import { getScanRequestContract } from "@signa/contracts-http/ballot";

export class GetScanRequestParamsDto extends createZodDto(getScanRequestContract.params) {}

export class GetScanRequestOutputDto extends createZodDto(getScanRequestContract.response) {}
