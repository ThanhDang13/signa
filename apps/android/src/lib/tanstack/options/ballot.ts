import type { CallOptions } from "@signa/dsl-http-client";
import { authenticatedClient } from "@signa/android/lib/api";
import { createKeys } from "@signa/android/lib/tanstack/query-key";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

import {
  getUploadUrlContract,
  getScanRequestContract,
  listScanRequestsContract,
  processBallotScanContract,
  pollScanStatusContract,
  retryScanContract
} from "@signa/contracts-http";

export type FilterType = "all" | "valid" | "invalid" | "pending" | "processing";

export const ballotKeys = createKeys("ballot", {
  all: () => [] as const,
  uploadUrl: (ballotId: string) => ["upload-url", ballotId] as const,
  processScan: (ballotId: string) => ["process-scan", ballotId] as const,
  scanRequests: (pageIndex: number, pageSize: number, filter?: FilterType) =>
    ["scan-requests", pageIndex, pageSize, filter] as const,
  scanRequest: (requestId: string) => ["scan-request", requestId] as const,
  pollScanStatus: () => ["poll-scan-status"] as const
});

export const ballotQueries = {
  getScanRequest: (requestId: string) =>
    queryOptions({
      queryKey: ballotKeys.scanRequest(requestId),
      queryFn: () =>
        authenticatedClient.call(getScanRequestContract, {
          params: { requestId }
        }),
      staleTime: 5_000,
      enabled: !!requestId
    }),

  listScanRequests: (pageIndex: number, pageSize: number, filter?: FilterType) =>
    queryOptions({
      queryKey: ballotKeys.scanRequests(pageIndex, pageSize, filter),
      queryFn: () => {
        // Map UI filter to backend status (only for pending/processing)
        let status: "pending" | "processing" | "completed" | "failed" | undefined;

        if (filter === "pending") {
          status = "pending";
        } else if (filter === "processing") {
          status = "processing";
        }
        // For "all", "valid", "invalid" - fetch all completed + failed and filter client-side

        return authenticatedClient.call(listScanRequestsContract, {
          query: { pageIndex, pageSize, status }
        });
      }
    }),

  pollScanStatus: () =>
    queryOptions({
      queryKey: ballotKeys.pollScanStatus(),
      queryFn: () => authenticatedClient.call(pollScanStatusContract, {})
    })
};

export const ballotMutations = {
  getUploadUrl: () =>
    mutationOptions({
      mutationKey: ballotKeys.uploadUrl(""),
      mutationFn: async (options: CallOptions<typeof getUploadUrlContract>) => {
        return authenticatedClient.call(getUploadUrlContract, options);
      }
    }),

  processScan: () =>
    mutationOptions({
      mutationKey: ballotKeys.processScan(""),
      mutationFn: async (options: CallOptions<typeof processBallotScanContract>) => {
        return authenticatedClient.call(processBallotScanContract, options);
      }
    }),

  retryScan: () =>
    mutationOptions({
      mutationKey: ["retry-scan"],
      mutationFn: async (options: CallOptions<typeof retryScanContract>) => {
        return authenticatedClient.call(retryScanContract, options);
      }
    })
};
