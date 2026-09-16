import { defineConfig, getEnv, getEnvAsNumber, getEnvOptional } from "@signa/nest-config";
import { QUEUE_CONFIG, S3_CONFIG, APP_CONFIG } from "./tokens";
import { queueConfigSchema, s3ConfigSchema, appConfigSchema } from "./schema";

export const appConfigFactory = defineConfig({
  token: APP_CONFIG,
  schema: appConfigSchema,
  factory: () => {
    const node = getEnv<"development" | "production" | "test">("NODE_ENV", "development");
    return {
      node,
      isDev: node === "development",
      ballotSecret: getEnv("BALLOT_SECRET")
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

export const CONFIG_FACTORIES = [appConfigFactory, queueConfigFactory, s3ConfigFactory] as const;
