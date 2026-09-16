import env from "@signa/android/lib/config/env";
import { createClient } from "@signa/dsl-http-client";
import { fetchAdapter } from "@signa/runtime-fetch-client";

export function createApiClient(token: string) {
  return createClient({
    adapter: fetchAdapter,
    baseUrl: env.API_URL,
    getHeaders: () => ({ Authorization: `Bearer ${token}` }),
    onError: (status, data) => {
      throw { status, error: data };
    }
  });
}

export const publicClient = createClient({
  adapter: fetchAdapter,
  baseUrl: env.API_URL,
  onError: (status, data) => {
    throw { status, error: data };
  }
});
