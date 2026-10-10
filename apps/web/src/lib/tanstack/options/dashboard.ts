import { getDashboardStatsContract } from "@signa/contracts-http/election";
import { CallOptions } from "@signa/dsl-http-client";
import { getDashboardStatsFn } from "@signa/web/lib/api/dashboard/dashboard";
import { createKeys } from "@signa/web/lib/tanstack/query-key";
import { Prettify } from "@signa/web/lib/types";
import { queryOptions } from "@tanstack/react-query";

export const dashboardKeys = createKeys("dashboard", {
  all: () => [] as const,
  stats: () => ["stats"] as const
});

export const dashboardQueries = {
  stats: (options?: Prettify<CallOptions<typeof getDashboardStatsContract>>) =>
    queryOptions({
      queryKey: dashboardKeys.stats(),
      queryFn: () => getDashboardStatsFn({ data: options ?? {} }),
      meta: { errorMessage: "Không thể tải thống kê bảng điều khiển. Vui lòng thử lại." }
    })
};
