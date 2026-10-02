import { z } from "zod";

export const pollScanStatusResponseSchema = z.object({
  items: z.array(
    z.object({
      requestId: z.string().uuid(),
      status: z.enum(["pending", "processing"])
    })
  )
});
