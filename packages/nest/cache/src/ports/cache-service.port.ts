export const CACHE_SERVICE = Symbol("CACHE_SERVICE");

export interface CacheService {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPrefix?(prefix: string): Promise<void>;
}
