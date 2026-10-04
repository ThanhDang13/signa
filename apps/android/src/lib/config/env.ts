import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url().default("https://sk03.id.vn/api")
});

const env = envSchema.parse(process.env);

export default env;
