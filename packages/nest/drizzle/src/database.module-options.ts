import type { ModuleMetadata, Type } from "@nestjs/common";
import type { DrizzlePGConfig } from "@knaadh/nestjs-drizzle-pg";

export interface DrizzleModuleOptions {
  tag?: string;
  config: DrizzlePGConfig;
}

export interface DrizzleConfigFactory {
  create(): DrizzlePGConfig | Promise<DrizzlePGConfig>;
}

export interface DrizzleModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  tag?: string;
  useClass?: Type<DrizzleConfigFactory>;
  useFactory?: (...args: unknown[]) => Promise<DrizzlePGConfig> | DrizzlePGConfig;
  inject?: unknown[];
}
