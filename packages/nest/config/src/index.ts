export * from "./config.module";
export * from "./inject-config.decorator";
export type { ConfigFactory, ConfigRegistry, ConfigToken } from "@signa/dsl-config";
export {
  createConfigToken,
  defineConfig,
  getEnv,
  getEnvAsBoolean,
  getEnvAsNumber,
  getEnvOptional
} from "@signa/dsl-config";
