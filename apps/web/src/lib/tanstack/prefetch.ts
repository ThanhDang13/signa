import { dehydrate, QueryClient } from "@tanstack/react-query";

export async function prefetchAndDehydrate(
  queryClient: QueryClient,
  prefetches: Promise<unknown>[]
) {
  await Promise.all(prefetches);
  return { dehydratedState: dehydrate(queryClient) };
}
