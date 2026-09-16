import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "stream";
import type {
  S3Service,
  UploadOptions,
  UploadResult,
  ListOptions,
  ListResult
} from "../ports/s3-service.port";
import { createError } from "@signa/dsl-error";
import {
  S3_UPLOAD_FAILED,
  S3_DOWNLOAD_FAILED,
  S3_DELETE_FAILED,
  S3_OBJECT_NOT_FOUND,
  S3_LIST_FAILED,
  S3_PRESIGNED_URL_FAILED,
  S3_COPY_FAILED
} from "../errors/s3.errors";

export interface AwsS3Config {
  bucket: string;
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  endpoint?: string;
  forcePathStyle?: boolean;
}

/**
 * AWS S3 service implementation using AWS SDK v3
 */
export class AwsS3Service implements S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: AwsS3Config) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      credentials: config.credentials,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle ?? false
    });
  }

  async upload(
    key: string,
    data: Buffer | Readable,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const body = Buffer.isBuffer(data) ? data : await this.streamToBuffer(data);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options?.contentType,
        Metadata: options?.metadata,
        CacheControl: options?.cacheControl,
        ContentDisposition: options?.contentDisposition
      });

      const response = await this.client.send(command);

      return {
        key,
        etag: response.ETag ?? "",
        versionId: response.VersionId
      };
    } catch (error) {
      throw createError(S3_UPLOAD_FAILED.code, {
        cause: error instanceof Error ? error : new Error(String(error)),
        context: { key }
      });
    }
  }

  async download(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw createError(S3_OBJECT_NOT_FOUND.code, { context: { key } });
      }

      return await this.streamToBuffer(response.Body as Readable);
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
        throw createError(S3_OBJECT_NOT_FOUND.code, {
          cause: error instanceof Error ? error : new Error(String(error)),
          context: { key }
        });
      }
      throw createError(S3_DOWNLOAD_FAILED.code, {
        cause: error instanceof Error ? error : new Error(String(error)),
        context: { key }
      });
    }
  }

  async downloadStream(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw createError(S3_OBJECT_NOT_FOUND.code, { context: { key } });
      }

      return response.Body as Readable;
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
        throw createError(S3_OBJECT_NOT_FOUND.code, {
          cause: error instanceof Error ? error : new Error(String(error)),
          context: { key }
        });
      }
      throw createError(S3_DOWNLOAD_FAILED.code, {
        cause: error instanceof Error ? error : new Error(String(error)),
        context: { key }
      });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.client.send(command);
    } catch (error) {
      throw createError(S3_DELETE_FAILED.code, {
        cause: error instanceof Error ? error : new Error(String(error)),
        context: { key }
      });
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: keys.map((key) => ({ Key: key }))
        }
      });

      await this.client.send(command);
    } catch (error) {
      throw createError(S3_DELETE_FAILED.code, {
        cause: error instanceof Error ? error : new Error(String(error)),
        context: { keys }
      });
    }
  }

  async getPresignedUploadUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      throw createError(S3_PRESIGNED_URL_FAILED.code, {
        cause: error instanceof Error ? error : new Error(String(error)),
        context: { key, expiresIn }
      });
    }
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      throw createError(S3_PRESIGNED_URL_FAILED.code, {
        cause: error instanceof Error ? error : new Error(String(error)),
        context: { key, expiresIn }
      });
    }
  }

  async list(prefix?: string, options?: ListOptions): Promise<ListResult> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: options?.maxKeys,
        ContinuationToken: options?.continuationToken
      });

      const response = await this.client.send(command);

      return {
        objects:
          response.Contents?.map((obj) => ({
            key: obj.Key ?? "",
            size: obj.Size ?? 0,
            lastModified: obj.LastModified ?? new Date(),
            etag: obj.ETag ?? ""
          })) ?? [],
        continuationToken: response.NextContinuationToken,
        isTruncated: response.IsTruncated ?? false
      };
    } catch (error) {
      throw createError(S3_LIST_FAILED.code, {
        cause: error instanceof Error ? error : new Error(String(error)),
        context: { prefix }
      });
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destKey
      });

      await this.client.send(command);
    } catch (error) {
      throw createError(S3_COPY_FAILED.code, {
        cause: error instanceof Error ? error : new Error(String(error)),
        context: { sourceKey, destKey }
      });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "NotFound") {
        return false;
      }
      throw createError(S3_DOWNLOAD_FAILED.code, {
        cause: error instanceof Error ? error : new Error(String(error)),
        context: { key }
      });
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}

/**
 * Factory function to create AWS S3 service
 */
export function createAwsS3Service(config: AwsS3Config): S3Service {
  return new AwsS3Service(config);
}
