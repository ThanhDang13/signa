import env from "@signa/android/lib/config/env";
import { createClient } from "@signa/dsl-http-client";
import { fetchAdapter } from "@signa/runtime-fetch-client";
import * as SecureStore from "expo-secure-store";

export function createApiClient(token: string) {
  return createClient({
    adapter: fetchAdapter,
    baseUrl: env.EXPO_PUBLIC_API_URL,
    getHeaders: () => ({ Authorization: `Bearer ${token}` }),
    onError: (status, data) => {
      throw { status, error: data };
    }
  });
}

export const publicClient = createClient({
  adapter: fetchAdapter,
  baseUrl: env.EXPO_PUBLIC_API_URL,
  onError: (status, data) => {
    throw { status, error: data };
  }
});

export const authenticatedClient = createClient({
  adapter: fetchAdapter,
  baseUrl: env.EXPO_PUBLIC_API_URL,
  getHeaders: async () => {
    // Read directly from SecureStore instead of using the atom store
    const tokensJson = await SecureStore.getItemAsync("auth-tokens");

    if (!tokensJson) {
      return {};
    }

    // Parse - might be double-stringified, so parse until we get an object
    let tokens = JSON.parse(tokensJson);

    // If still a string, parse again (double-stringified)
    if (typeof tokens === "string") {
      tokens = JSON.parse(tokens);
    }

    if (tokens?.accessToken) {
      return { Authorization: `Bearer ${tokens.accessToken}` as `Bearer ${string}` };
    }

    return {};
  },
  onError: (status, data) => {
    throw { status, error: data };
  }
});
