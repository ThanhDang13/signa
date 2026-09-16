import type { ModuleMetadata, Type } from "@nestjs/common";
import type { S3Service } from "../ports/s3-service.port";

/**
 * S3 module runtime options
 */
export interface NestS3Options {
  s3: S3Service;
}

/**
 * Factory interface for creating S3 options asynchronously
 */
export interface NestS3OptionsFactory {
  create(): NestS3Options | Promise<NestS3Options>;
}

/**
 * Async module options for S3 module
 */
export interface NestS3ModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  useClass: Type<NestS3OptionsFactory>;
}

/**
 * Injection token for S3 module options
 */
export const NEST_S3_OPTIONS = Symbol("NEST_S3_OPTIONS");
