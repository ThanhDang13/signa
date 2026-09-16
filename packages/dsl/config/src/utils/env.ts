import { createError } from "@signa/dsl-error";
import { CONFIG_MISSING, CONFIG_INVALID } from "../core/error-codes";

export function getEnv<T extends string = string>(
  key: keyof NodeJS.ProcessEnv,
  defaultValue?: T
): T {
  const value = process.env[key] as T;
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw createError(CONFIG_MISSING.code, {
      context: { key }
    });
  }
  return value;
}

export function getEnvOptional(key: string): string | undefined {
  return process.env[key];
}

export function getEnvAsNumber(key: string, defaultValue?: number): number {
  const value = getEnvOptional(key);
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw createError(CONFIG_MISSING.code, {
      context: { key }
    });
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw createError(CONFIG_INVALID.code, {
      context: { key, value, expectedType: "number" }
    });
  }
  return parsed;
}

export function getEnvAsBoolean(key: string, defaultValue?: boolean): boolean {
  const value = getEnvOptional(key);
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw createError(CONFIG_MISSING.code, {
      context: { key }
    });
  }
  return value === "true" || value === "1";
}
