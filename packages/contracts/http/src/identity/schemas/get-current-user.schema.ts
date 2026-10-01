import { z } from "zod";
import { ROLES } from "@signa/shared";

const roleValues = Object.values(ROLES);

export const getCurrentUserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullname: z.string(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  role: z.enum(roleValues as [string, ...string[]])
});
