import { Global, Module, DynamicModule } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import type { ErrorDispatcher, ErrorLogger } from "@signa/dsl-error";

import { ErrorExceptionFilter } from "./filters/error-exception.filter";
import { ErrorMapperService } from "./services/error-mapper.service";
import { ErrorSerializer } from "./serializers/error-serializer";
import { HttpErrorHandler } from "./handlers/http-error-handler";

import { ERROR_EXPOSURE } from "./exposure/tokens";
import { DefaultErrorExposure } from "./exposure/default-error-exposure";
import { ERROR_DISPATCHER, ERROR_LOGGER } from "./tokens";
import {
  ERROR_MODULE_OPTIONS,
  ErrorModuleAsyncOptions,
  ErrorModuleOptions,
  ErrorOptionsFactory
} from "./error-nest.module-options";
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod";
import { ErrorNormalizer } from "./normalizers/error-normalizer";

@Global()
@Module({})
export class ErrorNestModule {
  static registerAsync(options: ErrorModuleAsyncOptions): DynamicModule {
    const optionsProvider = {
      provide: ERROR_MODULE_OPTIONS,
      useFactory: async (factory: ErrorOptionsFactory) => {
        return factory.create();
      },
      inject: [options.useClass]
    };

    const exposureProvider = {
      provide: ERROR_EXPOSURE,
      useFactory: (opts: ErrorModuleOptions) => {
        return opts.exposure ?? new DefaultErrorExposure(opts.isDev);
      },
      inject: [ERROR_MODULE_OPTIONS]
    };

    const loggerProvider = {
      provide: ERROR_LOGGER,
      useFactory: (opts: ErrorModuleOptions): ErrorLogger => {
        return opts.createLogger();
      },
      inject: [ERROR_MODULE_OPTIONS]
    };

    const dispatcherProvider = {
      provide: ERROR_DISPATCHER,
      useFactory: (opts: ErrorModuleOptions, httpHandler: HttpErrorHandler): ErrorDispatcher => {
        const dispatcher = opts.createDispatcher();
        dispatcher.register(httpHandler);
        return dispatcher;
      },
      inject: [ERROR_MODULE_OPTIONS, HttpErrorHandler]
    };

    return {
      module: ErrorNestModule,
      imports: options.imports ?? [],
      providers: [
        options.useClass,
        optionsProvider,
        exposureProvider,
        loggerProvider,
        ErrorMapperService,
        ErrorSerializer,
        HttpErrorHandler,
        dispatcherProvider,
        ErrorNormalizer,
        {
          provide: APP_FILTER,
          useClass: ErrorExceptionFilter
        },
        {
          provide: APP_PIPE,
          useClass: ZodValidationPipe
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: ZodSerializerInterceptor
        }
      ],
      exports: [ErrorMapperService, ErrorSerializer, ERROR_EXPOSURE, ERROR_DISPATCHER, ERROR_LOGGER]
    };
  }
}
