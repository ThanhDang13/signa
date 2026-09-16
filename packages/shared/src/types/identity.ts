import type { userIdSchema } from "../schemas/identity";
import type z from "zod";

export type UserId$ = z.infer<typeof userIdSchema>;

import type { ROLES } from "../constants";

export type Role = (typeof ROLES)[keyof typeof ROLES];
