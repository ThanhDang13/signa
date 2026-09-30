import { createZodDto } from "@signa/nest-contract";
import { listScanRequestsContract } from "@signa/contracts-http/ballot";

export class ListScanRequestsQueryDto extends createZodDto(listScanRequestsContract.query) {}

export class ListScanRequestsOutputDto extends createZodDto(listScanRequestsContract.response) {}
