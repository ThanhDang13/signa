import { createDecorator } from "@toss/nestjs-aop";

export const CACHE_EVICT_DECORATOR = "CACHE_EVICT_DECORATOR";

export interface CacheEvictOptions<TArgs = unknown> {
  key?: (args: TArgs) => string;
  keys?: (args: TArgs) => string[];
  prefix?: (args: TArgs) => string;
  debug?: boolean;
}

export const CacheEvict = <TArgs = unknown>(options: CacheEvictOptions<TArgs>) =>
  createDecorator(CACHE_EVICT_DECORATOR, options);
