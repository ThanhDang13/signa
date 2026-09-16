import { Injectable } from "@nestjs/common";
import {
  type ErrorOptionsFactory,
  type ErrorModuleOptions,
  DefaultErrorExposure
} from "@signa/nest-error";
import { createConsoleErrorLogger, createErrorDispatcher } from "@signa/runtime-error";
import { InjectConfig } from "@signa/nest-config";
import { APP_CONFIG, type AppConfig } from "@signa/api/core/config";

@Injectable()
export class ErrorConfig implements ErrorOptionsFactory {
  constructor(
    @InjectConfig(APP_CONFIG)
    private readonly config: AppConfig
  ) {}

  create(): ErrorModuleOptions {
    return {
      isDev: this.config.isDev,
      exposure: new DefaultErrorExposure(this.config.isDev),
      createLogger: () => createConsoleErrorLogger(),
      createDispatcher: () => createErrorDispatcher()
    };
  }
}
