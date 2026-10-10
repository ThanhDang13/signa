import { createZodDto } from "@signa/nest-contract";
import {
  adminListScanRequestsQuerySchema,
  adminListScanRequestsResponseSchema
} from "@signa/contracts-http/ballot";

export class AdminListScanRequestsQueryDto extends createZodDto(adminListScanRequestsQuerySchema) {}
export class AdminListScanRequestsOutputDto extends createZodDto(adminListScanRequestsResponseSchema) {}
