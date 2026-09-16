/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from "zod";
import type { Eval } from "../utils";

type ExtractPathParams<T extends string> = T extends `${string}/:${infer Param}/${infer Rest}`
  ? Param | ExtractPathParams<`/${Rest}`>
  : T extends `${string}/:${infer Param}`
    ? Param
    : never;

export type ValidateParams<TPath extends string, TParams extends z.ZodObject<any>> = [
  ExtractPathParams<TPath>
] extends [never]
  ? TParams
  : keyof TParams["shape"] extends ExtractPathParams<TPath>
    ? ExtractPathParams<TPath> extends keyof TParams["shape"]
      ? TParams
      : never
    : never;

export type ParamMismatch<TPath extends string, TParams extends z.ZodObject<any>> = Eval<{
  __error__: "Params do not match path";
  expected: ExtractPathParams<TPath>;
  received: keyof TParams["shape"];
}>;
