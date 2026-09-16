import { defineError, createError } from "@signa/dsl-error";
import type { ZodError } from "zod";

/**
 * Queue not registered error
 */
export const QUEUE_NOT_FOUND = defineError({
  code: "QUEUE_NOT_FOUND",
  category: "internal",
  messageKey: "queue.not_found",
  defaultMessage: "Queue not registered"
});

export const createQueueNotFoundError = (queueName: string) =>
  createError(QUEUE_NOT_FOUND.code, {
    context: { queueName },
    message: `Queue "${queueName}" not registered`,
    metadata: { phase: "worker" }
  });

/**
 * Job handler not found error
 */
export const JOB_HANDLER_NOT_FOUND = defineError({
  code: "JOB_HANDLER_NOT_FOUND",
  category: "internal",
  messageKey: "queue.job_handler.not_found",
  defaultMessage: "Job handler not found"
});

export const createJobHandlerNotFoundError = (jobName: string, processorClass: string) =>
  createError(JOB_HANDLER_NOT_FOUND.code, {
    context: { jobName, processorClass },
    message: `No handler found for job "${jobName}" in ${processorClass}`,
    metadata: { phase: "worker" }
  });

/**
 * Job validation failed error
 */
export const JOB_VALIDATION_FAILED = defineError({
  code: "JOB_VALIDATION_FAILED",
  category: "validation",
  messageKey: "queue.job.validation_failed",
  defaultMessage: "Job validation failed"
});

export const createJobValidationError = (
  jobName: string,
  validationType: "data" | "result",
  zodError: ZodError
) =>
  createError(JOB_VALIDATION_FAILED.code, {
    context: {
      jobName,
      validationType,
      errors: zodError.issues
    },
    message: `Job "${jobName}" ${validationType} validation failed`,
    metadata: { phase: "worker" }
  });

/**
 * Job publish failed error
 */
export const JOB_PUBLISH_FAILED = defineError({
  code: "JOB_PUBLISH_FAILED",
  category: "external",
  messageKey: "queue.job.publish_failed",
  defaultMessage: "Failed to publish job"
});

export const createJobPublishError = (jobName: string, queueName: string, cause?: Error) =>
  createError(JOB_PUBLISH_FAILED.code, {
    context: { jobName, queueName },
    message: `Failed to publish job "${jobName}" to queue "${queueName}"`,
    metadata: { phase: "worker" },
    cause
  });
