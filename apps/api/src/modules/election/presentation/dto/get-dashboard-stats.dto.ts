import { createZodDto } from "@signa/nest-contract";
import { getDashboardStatsContract } from "@signa/contracts-http/election";

export class GetDashboardStatsOutputDto extends createZodDto(getDashboardStatsContract.response) {}
