import { defineError } from "@signa/dsl-error";

export const S3_UPLOAD_FAILED = defineError({
  code: "S3_UPLOAD_FAILED",
  category: "internal",
  messageKey: "s3.upload_failed",
  defaultMessage: "Failed to upload file to S3"
});

export const S3_DOWNLOAD_FAILED = defineError({
  code: "S3_DOWNLOAD_FAILED",
  category: "internal",
  messageKey: "s3.download_failed",
  defaultMessage: "Failed to download file from S3"
});

export const S3_DELETE_FAILED = defineError({
  code: "S3_DELETE_FAILED",
  category: "internal",
  messageKey: "s3.delete_failed",
  defaultMessage: "Failed to delete file from S3"
});

export const S3_OBJECT_NOT_FOUND = defineError({
  code: "S3_OBJECT_NOT_FOUND",
  category: "not_found",
  messageKey: "s3.object_not_found",
  defaultMessage: "Object not found in S3"
});

export const S3_LIST_FAILED = defineError({
  code: "S3_LIST_FAILED",
  category: "internal",
  messageKey: "s3.list_failed",
  defaultMessage: "Failed to list objects in S3"
});

export const S3_PRESIGNED_URL_FAILED = defineError({
  code: "S3_PRESIGNED_URL_FAILED",
  category: "internal",
  messageKey: "s3.presigned_url_failed",
  defaultMessage: "Failed to generate presigned URL"
});

export const S3_COPY_FAILED = defineError({
  code: "S3_COPY_FAILED",
  category: "internal",
  messageKey: "s3.copy_failed",
  defaultMessage: "Failed to copy object in S3"
});

export const S3_INVALID_CONFIGURATION = defineError({
  code: "S3_INVALID_CONFIGURATION",
  category: "internal",
  messageKey: "s3.invalid_configuration",
  defaultMessage: "Invalid S3 configuration"
});
