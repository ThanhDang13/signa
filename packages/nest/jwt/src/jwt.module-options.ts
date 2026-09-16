import type { InjectionToken, ModuleMetadata, Type } from "@nestjs/common";
import { JwtSignOptions } from "@nestjs/jwt";

/**
 * Runtime JWT configuration
 */
export interface NestJwtOptions {
  secret: string;
  expiresIn: JwtSignOptions["expiresIn"];
}

/**
 * Injection token for JWT options
 */
export const NEST_JWT_OPTIONS = Symbol("NEST_JWT_OPTIONS");

/**
 * Async factory interface (class-based)
 */
export interface NestJwtOptionsFactory {
  create(): NestJwtOptions | Promise<NestJwtOptions>;
}

/**
 * Async module configuration options
 */
export interface NestJwtModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  /**
   * Factory-based config
   */
  useFactory?: (...args: unknown[]) => NestJwtOptions | Promise<NestJwtOptions>;

  /**
   * Class-based config provider
   */
  useClass: Type<NestJwtOptionsFactory>;

  /**
   * Inject dependencies for useFactory
   */
  inject?: InjectionToken[];
}
