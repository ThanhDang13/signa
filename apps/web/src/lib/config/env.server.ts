import { z } from "zod";

const envSchema = z.object({
  API_URL: z.string().url().default("http://localhost:3000/api")
});

const env = envSchema.parse(process.env);

export default env;
