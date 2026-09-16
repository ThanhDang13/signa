export * from "./error-nest.module";
export * from "./filters/error-exception.filter";
export * from "./services/error-mapper.service";
export * from "./serializers/error-serializer";
export * from "./mappings/error-http-mapping";
export * from "./mappers/zod-error-mapper";
export * from "./exposure";
export * from "./error-nest.module-options";
export * from "./handlers";
export * from "./tokens";
export * from "./normalizers/error-normalizer";
export * from "./errors";

// Re-export error-dsl for NestJS consumers
export { createError, defineError, isDslError, wrapError } from "@signa/dsl-error";
export { ConsoleErrorLogger, handleBootstrapError } from "@signa/runtime-error";
export type { ErrorLogger } from "@signa/dsl-error";
