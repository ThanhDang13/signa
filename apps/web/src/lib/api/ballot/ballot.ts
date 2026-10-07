import { previewBallotContract } from "@signa/contracts-http/ballot";
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
