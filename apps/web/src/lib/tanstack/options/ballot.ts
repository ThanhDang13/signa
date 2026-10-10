import {
  previewBallotContract,
  listBallotBatchesContract,
  getBallotBatchContract,
  getBallotBatchDownloadContract,
  listBallotsContract,
  adminListScanRequestsContract,
  getScanRequestContract
} from "@signa/contracts-http/ballot";
import { CallOptions } from "@signa/dsl-http-client";
import {
  previewBallotFn,
  listBallotBatchesFn,
  getBallotBatchFn,
  getBallotBatchDownloadFn,
  listBallotsFn,
  adminListScanRequestsFn,
  getScanRequestFn
} from "@signa/web/lib/api/ballot/ballot";
import { createKeys } from "@signa/web/lib/tanstack/query-key";
import { Prettify } from "@signa/web/lib/types";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

export const ballotKeys = createKeys("ballot", {
  all: () => [] as const,
  preview: () => ["preview"] as const,
  batches: (electionId: string) => ["batches", electionId] as const,
  batch: (batchId: string) => ["batch", batchId] as const,
  batchDownload: (batchId: string) => ["batch-download", batchId] as const,
  list: (electionId?: string) => (electionId ? ["list", electionId] : ["list"]) as const,
  scanRequests: (electionId?: string) => (electionId ? ["scan-requests", electionId] : ["scan-requests"]) as const,
  scanRequest: (requestId: string) => ["scan-request", requestId] as const
});

export const ballotQueries = {
  list: (options: Prettify<CallOptions<typeof listBallotsContract>>) =>
    queryOptions({
      queryKey: ballotKeys.list(options.query?.electionId),
      queryFn: () => listBallotsFn({ data: options }),
      meta: { errorMessage: "Không thể tải danh sách phiếu bầu. Vui lòng thử lại." }
    }),
  listBatches: (options: Prettify<CallOptions<typeof listBallotBatchesContract>>) =>
    queryOptions({
      queryKey: ballotKeys.batches(options.params.electionId),
      queryFn: () => listBallotBatchesFn({ data: options }),
      meta: { errorMessage: "Không thể tải danh sách đợt tạo phiếu. Vui lòng thử lại." }
    }),
  getBatch: (options: Prettify<CallOptions<typeof getBallotBatchContract>>) =>
    queryOptions({
      queryKey: ballotKeys.batch(options.params.batchId),
      queryFn: () => getBallotBatchFn({ data: options }),
      meta: { errorMessage: "Không thể tải thông tin đợt tạo phiếu. Vui lòng thử lại." }
    }),
  getBatchDownload: (options: Prettify<CallOptions<typeof getBallotBatchDownloadContract>>) =>
    queryOptions({
      queryKey: ballotKeys.batchDownload(options.params.batchId),
      queryFn: () => getBallotBatchDownloadFn({ data: options }),
      staleTime: 0,
      gcTime: 0,
      meta: { errorMessage: "Không thể tạo link tải xuống. Vui lòng thử lại." }
    }),
  adminListScanRequests: (options: Prettify<CallOptions<typeof adminListScanRequestsContract>>) =>
    queryOptions({
      queryKey: ballotKeys.scanRequests(options.query?.electionId),
      queryFn: () => adminListScanRequestsFn({ data: options }),
      meta: { errorMessage: "Không thể tải danh sách yêu cầu quét. Vui lòng thử lại." }
    }),
  getScanRequest: (options: Prettify<CallOptions<typeof getScanRequestContract>>) =>
    queryOptions({
      queryKey: ballotKeys.scanRequest(options.params.requestId),
      queryFn: () => getScanRequestFn({ data: options }),
      meta: { errorMessage: "Không thể tải chi tiết yêu cầu quét. Vui lòng thử lại." }
    })
};

export const ballotMutations = {
  preview: () =>
    mutationOptions({
      mutationFn: (options: Prettify<CallOptions<typeof previewBallotContract>>) =>
        previewBallotFn({ data: options }),
      meta: { errorMessage: "Không thể xem trước phiếu bầu. Vui lòng thử lại." }
    })
};
