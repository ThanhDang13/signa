import type { DynamicModule, Provider } from "@nestjs/common";
import { Global, Module } from "@nestjs/common";
import type { S3Service } from "../ports/s3-service.port";
import { S3_SERVICE } from "../ports/s3-service.port";

import {
  NEST_S3_OPTIONS,
  NestS3Options,
  NestS3ModuleAsyncOptions,
  NestS3OptionsFactory
} from "./s3.module-options";

/**
 * S3 module for object storage operations
 *
 * @example
 * ```typescript
 * // In your config service
 * @Injectable()
 * export class S3Config implements NestS3OptionsFactory {
 *   constructor(@InjectConfig(S3_CONFIG) private config: S3Config) {}
 *
 *   create(): NestS3Options {
 *     return {
 *       s3: createAwsS3Service({
 *         bucket: this.config.bucket,
 *         region: this.config.region,
 *         credentials: this.config.credentials,
 *         endpoint: this.config.endpoint,
 *         forcePathStyle: this.config.forcePathStyle
 *       })
 *     };
 *   }
 * }
 *
 * // In your module
 * @Module({
 *   imports: [
 *     S3Module.registerAsync({
 *       useClass: S3Config
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class S3Module {
  /**
   * Register S3 module asynchronously with config provider
   */
  static registerAsync(options: NestS3ModuleAsyncOptions): DynamicModule {
    const optionsProvider = {
      provide: NEST_S3_OPTIONS,
      useFactory: async (factory: NestS3OptionsFactory) => {
        return factory.create();
      },
      inject: [options.useClass]
    };

    const optionsModule: DynamicModule = {
      module: class S3OptionsModule {},
      imports: options.imports,
      providers: [
        {
          provide: options.useClass,
          useClass: options.useClass
        },
        optionsProvider
      ],
      exports: [NEST_S3_OPTIONS]
    };

    const s3ServiceProvider: Provider = {
      provide: S3_SERVICE,
      useFactory: async (opts: NestS3Options) => {
        return opts.s3;
      },
      inject: [NEST_S3_OPTIONS]
    };

    return {
      module: S3Module,
      imports: [optionsModule, ...(options.imports ?? [])],
      providers: [options.useClass, optionsProvider, s3ServiceProvider],
      exports: [S3_SERVICE, NEST_S3_OPTIONS]
    };
  }
}
