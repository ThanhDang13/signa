import { createDecorator } from "@toss/nestjs-aop";

export const CACHE_DECORATOR = "CACHE_DECORATOR";

export interface CacheOptions<TArgs = unknown> {
  key: (args: TArgs) => string;
  ttl?: number;
  debug?: boolean;
}

export const Cache = <TArgs = unknown>(options: CacheOptions<TArgs>) =>
  createDecorator(CACHE_DECORATOR, options);
