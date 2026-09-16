/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from "zod";
import type { ValidateParams, ParamMismatch } from "./path-params";

type BaseContract<TPath extends string, TParams extends z.ZodObject<any, any>> = {
  path: TPath;
  response: z.ZodTypeAny;
  params?: ValidateParams<TPath, TParams> extends never ? ParamMismatch<TPath, TParams> : TParams;
};

type GetContract<
  TPath extends string = string,
  TParams extends z.ZodObject<any, any> = z.ZodObject<any, any>
> = BaseContract<TPath, TParams> & {
  method: "GET";
  query?: z.ZodTypeAny;
  body?: never;
};

type DeleteContract<
  TPath extends string = string,
  TParams extends z.ZodObject<any, any> = z.ZodObject<any, any>
> = BaseContract<TPath, TParams> & {
  method: "DELETE";
  query?: z.ZodTypeAny;
  body?: never;
};

type PostContract<
  TPath extends string = string,
  TParams extends z.ZodObject<any, any> = z.ZodObject<any, any>
> = BaseContract<TPath, TParams> & {
  method: "POST";
  body?: z.ZodTypeAny;
  query?: never;
};

type PutContract<
  TPath extends string = string,
  TParams extends z.ZodObject<any, any> = z.ZodObject<any, any>
> = BaseContract<TPath, TParams> & {
  method: "PUT" | "PATCH";
  body?: z.ZodTypeAny;
  query?: never;
};

export type Contract<
  TPath extends string = string,
  TParams extends z.ZodObject<any, any> = z.ZodObject<any, any>
> =
  | GetContract<TPath, TParams>
  | DeleteContract<TPath, TParams>
  | PostContract<TPath, TParams>
  | PutContract<TPath, TParams>;

export function defineContract<
  TPath extends string,
  TParams extends z.ZodObject<any, any>,
  T extends Contract<TPath, TParams>
>(config: T & BaseContract<TPath, TParams>): T {
  return config;
}
