import { defineJob } from "@signa/dsl-queue-contract";
import { z } from "zod";

/**
 * Test job contract for queue testing
 */
export const testJob = defineJob({
  queue: "test",
  job: "process-test",
  data: z.object({
    message: z.string(),
    delay: z.number().optional()
  }),
  result: z.object({
    processed: z.boolean(),
    timestamp: z.string(),
    originalMessage: z.string()
  })
});
