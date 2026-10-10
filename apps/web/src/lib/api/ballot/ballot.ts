import {
  previewBallotContract,
  listBallotBatchesContract,
  getBallotBatchContract,
  getBallotBatchDownloadContract,
  generateBallotsContract,
  listBallotsContract,
  adminListScanRequestsContract,
  getScanRequestContract
} from "@signa/contracts-http/ballot";
import { CallOptions } from "@signa/dsl-http-client";
import { withAuth } from "@signa/web/lib/api/api";
import { createServerFn } from "@tanstack/react-start";

export const previewBallotFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof previewBallotContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(previewBallotContract, data);
    });
  });

export const generateBallotsFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof generateBallotsContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(generateBallotsContract, data);
    });
  });

export const listBallotsFn = createServerFn({ method: "GET" })
  .validator((data: CallOptions<typeof listBallotsContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(listBallotsContract, data);
    });
  });

export const listBallotBatchesFn = createServerFn({ method: "GET" })
  .validator((data: CallOptions<typeof listBallotBatchesContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(listBallotBatchesContract, data);
    });
  });

export const getBallotBatchFn = createServerFn({ method: "GET" })
  .validator((data: CallOptions<typeof getBallotBatchContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(getBallotBatchContract, data);
    });
  });

export const getBallotBatchDownloadFn = createServerFn({ method: "GET" })
  .validator((data: CallOptions<typeof getBallotBatchDownloadContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(getBallotBatchDownloadContract, data);
    });
  });

export const adminListScanRequestsFn = createServerFn({ method: "GET" })
  .validator((data: CallOptions<typeof adminListScanRequestsContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(adminListScanRequestsContract, data);
    });
  });

export const getScanRequestFn = createServerFn({ method: "GET" })
  .validator((data: CallOptions<typeof getScanRequestContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(getScanRequestContract, data);
    });
  });
