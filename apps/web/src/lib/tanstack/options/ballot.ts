import { previewBallotContract } from "@signa/contracts-http/ballot";
import { CallOptions } from "@signa/dsl-http-client";
import { previewBallotFn } from "@signa/web/lib/api/ballot/ballot";
import { createKeys } from "@signa/web/lib/tanstack/query-key";
import { Prettify } from "@signa/web/lib/types";
import { mutationOptions } from "@tanstack/react-query";

export const ballotKeys = createKeys("ballot", {
  all: () => [] as const,
  preview: () => ["preview"] as const
});

export const ballotMutations = {
  preview: () =>
    mutationOptions({
      mutationFn: (options: Prettify<CallOptions<typeof previewBallotContract>>) =>
        previewBallotFn({ data: options })
    })
};
