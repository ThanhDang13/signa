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
import { withAuth } from "@signa/web/lib/api/api";
import { createServerFn } from "@tanstack/react-start";

export const listElectionsFn = createServerFn({ method: "GET" })
  .validator((data: CallOptions<typeof listElectionsContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(listElectionsContract, data);
    });
  });

export const getElectionFn = createServerFn({ method: "GET" })
  .validator((data: CallOptions<typeof getElectionContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(getElectionContract, data);
    });
  });

export const createElectionFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof createElectionContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(createElectionContract, data);
    });
  });

export const updateElectionFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof updateElectionContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(updateElectionContract, data);
    });
  });

export const activateElectionFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof activateElectionContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(activateElectionContract, data);
    });
  });

export const closeElectionFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof closeElectionContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(closeElectionContract, data);
    });
  });

export const deleteElectionFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof deleteElectionContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(deleteElectionContract, data);
    });
  });

export const getElectionResultsFn = createServerFn({ method: "GET" })
  .validator((data: CallOptions<typeof getElectionResultsContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(getElectionResultsContract, data);
    });
  });
