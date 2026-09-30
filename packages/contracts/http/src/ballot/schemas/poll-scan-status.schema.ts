import { z } from "zod";

export const pollScanStatusQuerySchema = z.object({
  since: z.string().datetime().optional()
});

export const pollScanStatusResponseSchema = z.object({
  items: z.array(
    z.object({
      requestId: z.string().uuid(),
      status: z.enum(["pending", "processing", "completed", "failed"]),
      updatedAt: z.string()
    })
  ),
  serverTime: z.string()
});
