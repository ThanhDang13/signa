import { defineError } from "@signa/dsl-error";

// Config error codes
export const CONFIG_MISSING = defineError({
  code: "CONFIG_MISSING",
  category: "internal",
  messageKey: "config.missing",
  defaultMessage: "Missing required environment variable"
});

export const CONFIG_INVALID = defineError({
  code: "CONFIG_INVALID",
  category: "validation",
  messageKey: "config.invalid",
  defaultMessage: "Invalid configuration value"
});

export const CONFIG_ALREADY_REGISTERED = defineError({
  code: "CONFIG_ALREADY_REGISTERED",
  category: "internal",
  messageKey: "config.already_registered",
  defaultMessage: "Config factory already registered"
});

export const CONFIG_NOT_LOADED = defineError({
  code: "CONFIG_NOT_LOADED",
  category: "internal",
  messageKey: "config.not_loaded",
  defaultMessage: "Config not loaded for token"
});

export const CONFIG_INVALID_ENV = defineError({
  code: "CONFIG_INVALID_ENV",
  category: "internal",
  messageKey: "config.invalid_env",
  defaultMessage: "Environment configuration is invalid"
});
