import type { InjectionToken, ModuleMetadata, Type } from "@nestjs/common";
import type { ErrorLogger, ErrorDispatcher } from "@signa/dsl-error";
import { ErrorExposure } from "./exposure";

export const ERROR_MODULE_OPTIONS = Symbol("ERROR_MODULE_OPTIONS");

/**
 * Configuration options for ErrorNestModule.
 */
export interface ErrorModuleOptions {
  /**
   * Whether the application is running in development mode.
   * Controls default error message exposure behavior.
   */
  isDev: boolean;

  /**
   * Optional custom error exposure strategy.
   * If not provided, DefaultErrorExposure will be used.
   */
  exposure?: ErrorExposure;

  /**
   * Factory function to create ErrorLogger.
   * Must be provided by the application level.
   */
  createLogger: () => ErrorLogger;

  /**
   * Factory function to create ErrorDispatcher.
   * Must be provided by the application level.
   */
  createDispatcher: () => ErrorDispatcher;
}

/**
 * Async configuration options for ErrorNestModule.
 */
export interface ErrorModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  /**
   * Factory-based configuration
   */
  useFactory?: (...args: unknown[]) => ErrorModuleOptions | Promise<ErrorModuleOptions>;

  /**
   * Class-based configuration provider
   */
  useClass: Type<ErrorOptionsFactory>;

  /**
   * Dependencies to inject into useFactory
   */
  inject?: InjectionToken[];
}

/**
 * Factory interface for class-based async config
 */
export interface ErrorOptionsFactory {
  create(): ErrorModuleOptions | Promise<ErrorModuleOptions>;
}
