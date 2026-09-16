import type { z } from "zod";

export type InferBody<T> = T extends { body?: infer B extends z.ZodType } ? z.infer<B> : never;

export type InferParams<T> = T extends { params?: infer P extends z.ZodType } ? z.infer<P> : never;

export type InferQuery<T> = T extends { query?: infer Q extends z.ZodType } ? z.infer<Q> : never;

export type InferResponse<T> = T extends { response: infer R extends z.ZodType }
  ? z.infer<R>
  : never;

export type InferBodyInput<T> = T extends { body?: infer B extends z.ZodType } ? z.input<B> : never;

export type InferParamsInput<T> = T extends { params?: infer P extends z.ZodType }
  ? z.input<P>
  : never;

export type InferQueryInput<T> = T extends { query?: infer Q extends z.ZodType }
  ? z.input<Q>
  : never;
