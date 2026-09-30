import env from "@signa/android/lib/config/env";
import { createClient } from "@signa/dsl-http-client";
import { fetchAdapter } from "@signa/runtime-fetch-client";
import * as SecureStore from "expo-secure-store";

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

export const authenticatedClient = createClient({
  adapter: fetchAdapter,
  baseUrl: env.API_URL,
  getHeaders: async () => {
    console.log("getHeaders called");
    // Read directly from SecureStore instead of using the atom store
    const tokensJson = await SecureStore.getItemAsync("auth-tokens");

    if (!tokensJson) {
      console.log("No tokens found in SecureStore");
      return {};
    }

    // Parse - might be double-stringified, so parse until we get an object
    let tokens = JSON.parse(tokensJson);
    console.log("First parse - typeof:", typeof tokens);

    // If still a string, parse again (double-stringified)
    if (typeof tokens === "string") {
      tokens = JSON.parse(tokens);
      console.log("Second parse - typeof:", typeof tokens);
    }

    console.log("Final tokens:", tokens);
    console.log("tokens.accessToken:", tokens.accessToken);

    if (tokens?.accessToken) {
      const headers = { Authorization: `Bearer ${tokens.accessToken}` as `Bearer ${string}` };
      console.log("headers to send:", headers);
      return headers;
    }

    console.log("No accessToken found, returning empty headers");
    return {};
  },
  onError: (status, data) => {
    throw { status, error: data };
  }
});
