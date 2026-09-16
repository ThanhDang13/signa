import type { Readable } from "stream";

/**
 * Upload options for S3 operations
 */
export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  contentDisposition?: string;
}

/**
 * Result of an upload operation
 */
export interface UploadResult {
  key: string;
  etag: string;
  versionId?: string;
}

/**
 * Options for listing objects
 */
export interface ListOptions {
  maxKeys?: number;
  continuationToken?: string;
}

/**
 * Result of a list operation
 */
export interface ListResult {
  objects: Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
  }>;
  continuationToken?: string;
  isTruncated: boolean;
}

/**
 * S3 service port - defines the interface for object storage operations
 */
export interface S3Service {
  /**
   * Upload a file to S3
   */
  upload(key: string, data: Buffer | Readable, options?: UploadOptions): Promise<UploadResult>;

  /**
   * Download a file from S3 as a buffer
   */
  download(key: string): Promise<Buffer>;

  /**
   * Download a file from S3 as a stream
   */
  downloadStream(key: string): Promise<Readable>;

  /**
   * Delete a single object from S3
   */
  delete(key: string): Promise<void>;

  /**
   * Delete multiple objects from S3
   */
  deleteMany(keys: string[]): Promise<void>;

  /**
   * Generate a presigned URL for uploading
   */
  getPresignedUploadUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Generate a presigned URL for downloading
   */
  getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * List objects in the bucket with optional prefix
   */
  list(prefix?: string, options?: ListOptions): Promise<ListResult>;

  /**
   * Copy an object within the bucket
   */
  copy(sourceKey: string, destKey: string): Promise<void>;

  /**
   * Check if an object exists
   */
  exists(key: string): Promise<boolean>;
}

/**
 * Injection token for S3 service
 */
export const S3_SERVICE = Symbol("S3_SERVICE");
