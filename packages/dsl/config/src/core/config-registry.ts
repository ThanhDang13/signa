import type { z } from "zod";
import { createError, isZodError, toDslValidationErrorFromZodError } from "@signa/dsl-error";
import { CONFIG_ALREADY_REGISTERED, CONFIG_INVALID_ENV, CONFIG_NOT_LOADED } from "./error-codes";
import type { ConfigFactory } from "./config-factory";
import type { ConfigToken } from "./config-token";

export class ConfigRegistry {
  private readonly factories = new Map<ConfigToken<unknown>, ConfigFactory<z.ZodType>>();
  private readonly values = new Map<ConfigToken<unknown>, unknown>();

  register(factory: ConfigFactory<z.ZodType>): void {
    if (this.factories.has(factory.token)) {
      throw createError(CONFIG_ALREADY_REGISTERED.code, {
        context: { token: factory.token.toString() }
      });
    }
    this.factories.set(factory.token, factory);
  }

  load(env: Record<string, string | undefined>): void {
    for (const [token, factory] of this.factories.entries()) {
      const rawValue = factory.factory(env);
      try {
        const parsed = factory.schema.parse(rawValue);

        this.values.set(token, parsed);
      } catch (err) {
        if (isZodError(err)) {
          throw toDslValidationErrorFromZodError(err);
        }
        throw createError(CONFIG_INVALID_ENV.code);
      }
    }
  }

  get<T>(token: ConfigToken<T>): T {
    if (!this.values.has(token)) {
      throw createError(CONFIG_NOT_LOADED.code, {
        context: { token: token.toString() }
      });
    }
    return this.values.get(token) as T;
  }

  has(token: ConfigToken<unknown>): boolean {
    return this.values.has(token);
  }
}
