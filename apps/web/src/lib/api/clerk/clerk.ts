import {
  createClerkContract,
  listClerksContract,
  updateClerkContract,
  deleteClerkContract,
  resetClerkPasswordContract
} from "@signa/contracts-http/identity";
import { CallOptions } from "@signa/dsl-http-client";
import { withAuth } from "@signa/web/lib/api/api";
import { createServerFn } from "@tanstack/react-start";

export const listClerksFn = createServerFn({ method: "GET" })
  .validator((data: CallOptions<typeof listClerksContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(listClerksContract, data);
    });
  });

export const createClerkFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof createClerkContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(createClerkContract, data);
    });
  });

export const updateClerkFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof updateClerkContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(updateClerkContract, data);
    });
  });

export const deleteClerkFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof deleteClerkContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(deleteClerkContract, data);
    });
  });

export const resetClerkPasswordFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof resetClerkPasswordContract>) => data)
  .handler(async ({ data }) => {
    return withAuth(async (api) => {
      return api.call(resetClerkPasswordContract, data);
    });
  });
