import type { InjectionToken, ModuleMetadata, Type } from "@nestjs/common";

/**
 * Redis connection configuration
 */
export interface RedisConnection {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

/**
 * Default job options
 */
export interface DefaultJobOptions {
  attempts?: number;
  backoff?: {
    type: "exponential" | "fixed";
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

/**
 * Runtime queue configuration
 */
export interface NestQueueOptions {
  connection: RedisConnection;
  defaultJobOptions?: DefaultJobOptions;
}

/**
 * Injection token for queue options
 */
export const NEST_QUEUE_OPTIONS = Symbol("NEST_QUEUE_OPTIONS");

/**
 * Async factory interface (class-based)
 */
export interface NestQueueOptionsFactory {
  create(): NestQueueOptions | Promise<NestQueueOptions>;
}

/**
 * Async module configuration options
 */
export interface NestQueueModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  /**
   * Factory-based config
   */
  useFactory?: (...args: unknown[]) => NestQueueOptions | Promise<NestQueueOptions>;

  /**
   * Class-based config provider
   */
  useClass: Type<NestQueueOptionsFactory>;

  /**
   * Inject dependencies for useFactory
   */
  inject?: InjectionToken[];
}
