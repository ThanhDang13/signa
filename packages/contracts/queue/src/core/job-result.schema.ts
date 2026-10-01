import { z } from "zod";

/**
 * Job result envelope schema
 * Used to wrap job results for durable delivery through result queues
 */
export const jobResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    jobId: z.string().describe("Format: ${requestId}-${attempt}"),
    requestId: z.string().uuid().describe("Explicit request ID for parsing"),
    attempt: z.number().int().positive().describe("Attempt number for stale result detection"),
    status: z.enum(["completed", "failed"]),
    data: dataSchema.optional().describe("Job-specific result data (only present on completed)"),
    error: z
      .object({
        message: z.string(),
        isRetryable: z.boolean().describe("Whether this error is transient and should be retried")
      })
      .optional()
      .describe("Error details (only present on failed)")
  });

export type JobResult<T> = {
  jobId: string;
  requestId: string;
  attempt: number;
  status: "completed" | "failed";
  data?: T;
  error?: {
    message: string;
    isRetryable: boolean;
  };
};
