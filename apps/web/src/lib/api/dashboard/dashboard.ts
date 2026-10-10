import { getDashboardStatsContract } from "@signa/contracts-http/election";
import { CallOptions } from "@signa/dsl-http-client";
import { withAuth } from "@signa/web/lib/api/api";
import { createServerFn } from "@tanstack/react-start";

export const getDashboardStatsFn = createServerFn({ method: "GET" })
  .validator((data: CallOptions<typeof getDashboardStatsContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(getDashboardStatsContract, data);
    });
  });
