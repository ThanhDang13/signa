import { CallOptions } from "@signa/dsl-http-client";
import { authenticatedClient, publicClient } from "@signa/android/lib/api";
import { createKeys } from "@signa/android/lib/tanstack/query-key";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";

import { loginContract, refreshContract, getCurrentUserContract } from "@signa/contracts-http";

export const authKeys = createKeys("auth", {
  all: () => [] as const,
  login: () => ["login"] as const,
  register: () => ["register"] as const,
  refresh: () => ["refresh"] as const,
  logout: () => ["logout"] as const,
  me: () => ["me"] as const
});

export const getMeOptions = () =>
  queryOptions({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const result = await authenticatedClient.call(getCurrentUserContract, {});
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });

export const authMutations = {
  login: () =>
    mutationOptions({
      mutationKey: authKeys.login(),
      mutationFn: async (options: CallOptions<typeof loginContract>) => {
        const result = await publicClient.call(loginContract, options);

        if (result.accessToken && result.refreshToken) {
          // Write tokens directly to SecureStore
          await SecureStore.setItemAsync(
            "auth-tokens",
            JSON.stringify({
              accessToken: result.accessToken,
              refreshToken: result.refreshToken
            })
          );
        }

        return result;
      },
      meta: {
        refetchQuery: [authKeys.me()], // Refetch /me before redirect
        redirectTo: "/"
      }
    }),

  refresh: () =>
    mutationOptions({
      mutationKey: authKeys.refresh(),
      mutationFn: async (options: CallOptions<typeof refreshContract>) => {
        throw new Error("Not implemented");
      },
      meta: {}
    }),

  logout: () =>
    mutationOptions({
      mutationKey: authKeys.logout(),
      mutationFn: async () => {
        await SecureStore.deleteItemAsync("auth-tokens");
      },
      meta: {
        removeQuery: [authKeys.me()], // Remove /me query cache
        redirectTo: "/(auth)/login",
        replace: true
      }
    })
};
