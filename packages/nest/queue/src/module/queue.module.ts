import { Module, type DynamicModule } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { DiscoveryModule } from "@nestjs/core";

import {
  NEST_QUEUE_OPTIONS,
  NestQueueOptions,
  NestQueueModuleAsyncOptions,
  NestQueueOptionsFactory
} from "./queue.module-options";
import { JobResultConsumer } from "../services/job-result-consumer.service";

/**
 * Queue module for BullMQ integration with type-safe queue contracts
 *
 * @example
 * ```typescript
 * // In your config service
 * @Injectable()
 * export class QueueConfig implements NestQueueOptionsFactory {
 *   constructor(@InjectConfig(QUEUE_CONFIG) private config: QueueConfig) {}
 *
 *   create(): NestQueueOptions {
 *     return {
 *       connection: {
 *         host: this.config.redis.host,
 *         port: this.config.redis.port,
 *         password: this.config.redis.password,
 *         db: this.config.redis.db
 *       }
 *     };
 *   }
 * }
 *
 * // In your module
 * @Module({
 *   imports: [
 *     QueueModule.registerAsync({
 *       useClass: QueueConfig
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class QueueModule {
  /**
   * Register queue module asynchronously with config provider
   */
  static registerAsync(options: NestQueueModuleAsyncOptions): DynamicModule {
    const optionsProvider = {
      provide: NEST_QUEUE_OPTIONS,
      useFactory: async (factory: NestQueueOptionsFactory) => {
        return factory.create();
      },
      inject: [options.useClass]
    };

    const optionsModule: DynamicModule = {
      module: class QueueOptionsModule {},
      imports: options.imports,
      providers: [
        {
          provide: options.useClass,
          useClass: options.useClass
        },
        optionsProvider
      ],
      exports: [NEST_QUEUE_OPTIONS]
    };

    const bullModule = BullModule.forRootAsync({
      imports: [optionsModule],
      inject: [NEST_QUEUE_OPTIONS],
      useFactory: async (opts: NestQueueOptions) => ({
        connection: opts.connection,
        defaultJobOptions: opts.defaultJobOptions
      })
    });

    return {
      module: QueueModule,
      imports: [DiscoveryModule, bullModule, ...(options.imports ?? [])],
      providers: [options.useClass, optionsProvider, JobResultConsumer],
      exports: [BullModule, NEST_QUEUE_OPTIONS, JobResultConsumer]
    };
  }

  /**
   * Register a specific queue
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     QueueModule.registerQueue('email')
   *   ]
   * })
   * export class EmailModule {}
   * ```
   */
  static registerQueue(name: string): DynamicModule {
    return {
      module: QueueModule,
      imports: [BullModule.registerQueue({ name })],
      exports: [BullModule]
    };
  }
}
