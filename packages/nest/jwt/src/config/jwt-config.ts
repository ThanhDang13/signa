import { JwtSignOptions } from "@nestjs/jwt";
import { z } from "zod";

export const jwtConfigSchema = z.object({
  secret: z.string(),
  expiresIn: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => v as JwtSignOptions["expiresIn"] | undefined)
});

export type JwtConfig = z.infer<typeof jwtConfigSchema>;
