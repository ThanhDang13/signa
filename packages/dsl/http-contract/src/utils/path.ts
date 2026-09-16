import type { Contract } from "../core";
import type { InferParams } from "./infer";

export function buildPath<T extends Contract>(contract: T): string;

export function buildPath<T extends Contract>(
  contract: T,
  params: NonNullable<InferParams<T>>
): string;

export function buildPath<T extends Contract>(contract: T, params?: InferParams<T>) {
  let path = contract.path;

  if (params) {
    for (const key in params) {
      path = path.replace(`:${key}`, String(params[key as keyof typeof params]));
    }
  }

  return path;
}
