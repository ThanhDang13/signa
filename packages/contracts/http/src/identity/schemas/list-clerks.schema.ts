import { z } from "zod";
import { createPaginationQuerySchema, paginatedResponseSchema } from "@signa/shared";

const clerkReadModelSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullname: z.string(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  role: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
});

export const listClerksQuerySchema = createPaginationQuerySchema({
  sortBy: z.enum(["email", "fullname", "createdAt"]).default("createdAt")
});

export const listClerksResponseSchema = paginatedResponseSchema(clerkReadModelSchema);
