import { defineConfig, getEnv, getEnvAsNumber, getEnvOptional } from "@signa/nest-config";
import {
  APP_CONFIG,
  AppConfig,
  DATABASE_CONFIG,
  JWT_CONFIG,
  QUEUE_CONFIG,
  CACHE_CONFIG,
  S3_CONFIG
} from "@signa/api/core/config/tokens";
import {
  appConfigSchema,
  databaseConfigSchema,
  jwtConfigSchema,
  queueConfigSchema,
  cacheConfigSchema,
  s3ConfigSchema
} from "@signa/api/core/config/schema";
import { buildPostgresUrl } from "@signa/runtime-drizzle";

export const appConfigFactory = defineConfig({
  token: APP_CONFIG,
  schema: appConfigSchema,
  factory: () => {
    const node = getEnv<AppConfig["node"]>("NODE_ENV", "development");
    return {
      port: getEnvAsNumber("PORT", 3000),
      node,
      isDev: node === "development",
      ballotSecret: getEnv("BALLOT_SECRET")
    };
  }
});

export const databaseConfigFactory = defineConfig({
  token: DATABASE_CONFIG,
  schema: databaseConfigSchema,
  factory: () => {
    const user = getEnv("DB_USER");
    const password = getEnv("DB_PASSWORD");
    const host = getEnv("DB_HOST");
    const port = getEnvAsNumber("DB_PORT");
    const database = getEnv("DB_NAME");

    return {
      url: buildPostgresUrl({
        user,
        password,
        host,
        port,
        database
      }),
      user,
      password,
      host,
      port,
      database
    };
  }
});

export const jwtConfigFactory = defineConfig({
  token: JWT_CONFIG,
  schema: jwtConfigSchema,
  factory: () => {
    const secret = getEnv("JWT_SECRET", "dev");
    const expiresIn = getEnv("JWT_EXPIRES_IN", "15m");

    return {
      secret,
      expiresIn
    };
  }
});

export const queueConfigFactory = defineConfig({
  token: QUEUE_CONFIG,
  schema: queueConfigSchema,
  factory: () => {
    return {
      redis: {
        host: getEnv("REDIS_HOST", "localhost"),
        port: getEnvAsNumber("REDIS_PORT", 6379),
        password: getEnvOptional("REDIS_PASSWORD"),
        db: getEnvAsNumber("REDIS_DB", 0)
      }
    };
  }
});

export const cacheConfigFactory = defineConfig({
  token: CACHE_CONFIG,
  schema: cacheConfigSchema,
  factory: () => {
    const cacheType = getEnv<"redis" | "memory">("CACHE_TYPE", "memory");

    if (cacheType === "redis") {
      return {
        type: "redis" as const,
        redis: {
          host: getEnv("REDIS_HOST", "localhost"),
          port: getEnvAsNumber("REDIS_PORT", 6379),
          password: getEnvOptional("REDIS_PASSWORD"),
          db: getEnvAsNumber("REDIS_DB", 0)
        }
      };
    }

    return {
      type: "memory" as const
    };
  }
});

export const s3ConfigFactory = defineConfig({
  token: S3_CONFIG,
  schema: s3ConfigSchema,
  factory: () => {
    return {
      bucket: getEnv("S3_BUCKET"),
      region: getEnv("S3_REGION", "us-east-1"),
      credentials: {
        accessKeyId: getEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY")
      },
      endpoint: getEnvOptional("S3_ENDPOINT"),
      forcePathStyle: getEnvOptional("S3_FORCE_PATH_STYLE") === "true"
    };
  }
});

export const CONFIG_FACTORIES = [
  appConfigFactory,
  databaseConfigFactory,
  jwtConfigFactory,
  queueConfigFactory,
  cacheConfigFactory,
  s3ConfigFactory
] as const;
