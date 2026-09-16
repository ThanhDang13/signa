/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from "zod";

export type JobContract = {
  queue: string;
  job: string;
  data: z.ZodTypeAny;
  result: z.ZodTypeAny;
};

export function defineJob<
  TQueue extends string,
  TJob extends string,
  TData extends z.ZodTypeAny,
  TResult extends z.ZodTypeAny = z.ZodVoid
>(config: {
  queue: TQueue;
  job: TJob;
  data: TData;
  result?: TResult;
}): JobContract & {
  queue: TQueue;
  job: TJob;
  data: TData;
  result: TResult extends z.ZodTypeAny ? TResult : z.ZodVoid;
} {
  return {
    queue: config.queue,
    job: config.job,
    data: config.data,
    result: (config.result ?? (null as any)) as TResult extends z.ZodTypeAny ? TResult : z.ZodVoid
  };
}
