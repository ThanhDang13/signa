import type { z } from "zod";
import type { ConfigToken } from "./config-token";

export interface ConfigFactory<TSchema extends z.ZodType> {
  token: ConfigToken<z.infer<TSchema>>;
  schema: TSchema;
  factory: (env: Record<string, string | undefined>) => z.infer<TSchema>;
}

export function defineConfig<TSchema extends z.ZodType>(
  config: ConfigFactory<TSchema>
): ConfigFactory<TSchema> {
  return config;
}
