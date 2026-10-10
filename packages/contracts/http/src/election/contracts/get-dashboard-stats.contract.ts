import { defineContract } from "@signa/dsl-http-contract";
import { getDashboardStatsResponseSchema } from "../schemas/get-dashboard-stats.schema";

export const getDashboardStatsContract = defineContract({
  method: "GET",
  path: "/v1/dashboard/stats",
  response: getDashboardStatsResponseSchema
});
