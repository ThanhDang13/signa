import {
  listElectionsContract,
  getElectionContract,
  createElectionContract,
  updateElectionContract,
  activateElectionContract,
  closeElectionContract,
  deleteElectionContract,
  getElectionResultsContract
} from "@signa/contracts-http/election";
import { CallOptions } from "@signa/dsl-http-client";
import {
  listElectionsFn,
  getElectionFn,
  createElectionFn,
  updateElectionFn,
  activateElectionFn,
  closeElectionFn,
  deleteElectionFn,
  getElectionResultsFn
} from "@signa/web/lib/api/election/election";
import { createKeys } from "@signa/web/lib/tanstack/query-key";
import { Prettify } from "@signa/web/lib/types";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

export const electionKeys = createKeys("election", {
  all: () => [] as const,
  list: (query?: CallOptions<typeof listElectionsContract>) => ["list", query] as const,
  detail: (id: string) => ["detail", id] as const,
  results: (id: string) => ["results", id] as const
});

export const electionQueries = {
  list: (options: Prettify<CallOptions<typeof listElectionsContract>>) =>
    queryOptions({
      queryKey: electionKeys.list(options),
      queryFn: () => listElectionsFn({ data: options })
    }),

  detail: (options: Prettify<CallOptions<typeof getElectionContract>>) =>
    queryOptions({
      queryKey: electionKeys.detail(options.params.id),
      queryFn: () => getElectionFn({ data: options })
    }),

  results: (options: Prettify<CallOptions<typeof getElectionResultsContract>>) =>
    queryOptions({
      queryKey: electionKeys.results(options.params.id),
      queryFn: () => getElectionResultsFn({ data: options }),
      refetchInterval: 30000 // Auto-refresh every 30 seconds for live results
    })
};

export const electionMutations = {
  create: () =>
    mutationOptions({
      mutationFn: (options: Prettify<CallOptions<typeof createElectionContract>>) =>
        createElectionFn({ data: options }),
      meta: {
        successMessage: "Tạo cuộc bầu cử thành công",
        errorMessage: "Tạo cuộc bầu cử thất bại",
        invalidatesQuery: [electionKeys.all()]
      }
    }),

  update: () =>
    mutationOptions({
      mutationFn: (options: Prettify<CallOptions<typeof updateElectionContract>>) =>
        updateElectionFn({ data: options }),
      meta: {
        successMessage: "Cập nhật cuộc bầu cử thành công",
        errorMessage: "Cập nhật cuộc bầu cử thất bại",
        invalidatesQuery: [electionKeys.all()]
      }
    }),

  activate: () =>
    mutationOptions({
      mutationFn: (options: Prettify<CallOptions<typeof activateElectionContract>>) =>
        activateElectionFn({ data: options }),
      meta: {
        successMessage: "Kích hoạt cuộc bầu cử thành công",
        errorMessage: "Kích hoạt cuộc bầu cử thất bại",
        invalidatesQuery: [electionKeys.all()]
      }
    }),

  close: () =>
    mutationOptions({
      mutationFn: (options: Prettify<CallOptions<typeof closeElectionContract>>) =>
        closeElectionFn({ data: options }),
      meta: {
        successMessage: "Đóng cuộc bầu cử thành công",
        errorMessage: "Đóng cuộc bầu cử thất bại",
        invalidatesQuery: [electionKeys.all()]
      }
    }),

  delete: () =>
    mutationOptions({
      mutationFn: (options: Prettify<CallOptions<typeof deleteElectionContract>>) =>
        deleteElectionFn({ data: options }),
      meta: {
        successMessage: "Xóa cuộc bầu cử thành công",
        errorMessage: "Xóa cuộc bầu cử thất bại",
        invalidatesQuery: [electionKeys.all()]
      }
    })
};
