import { CallOptions } from "@signa/dsl-http-client";
import { publicClient } from "@signa/android/lib/api";
import { createKeys } from "@signa/android/lib/tanstack/query-key";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { getDefaultStore } from "jotai";
import { authTokensAtom, authUserAtom, setAuthAtom } from "@signa/android/lib/atoms/auth";

import { loginContract, refreshContract } from "@signa/contracts-http";

const store = getDefaultStore();

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
      throw new Error("Not implemented");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });

export const authMutations = {
  login: () =>
    mutationOptions({
      mutationKey: authKeys.login(),
      mutationFn: async (options: CallOptions<typeof loginContract>) => {
        console.log("[Auth Mutation] Login - calling API");
        const result = await publicClient.call(loginContract, options);
        console.log("[Auth Mutation] Login - API response:", {
          hasAccessToken: !!result.accessToken,
          hasRefreshToken: !!result.refreshToken,
          accessTokenLength: result.accessToken?.length,
          refreshTokenLength: result.refreshToken?.length
        });
        return result;
      },
      onSuccess: (result) => {
        console.log("[Auth Mutation] onSuccess triggered");
        console.log("[Auth Mutation] Result:", {
          hasAccessToken: !!result.accessToken,
          hasRefreshToken: !!result.refreshToken
        });

        if (result.accessToken && result.refreshToken) {
          console.log("[Auth Mutation] Setting tokens in store");

          // Check current state before setting
          const beforeTokens = store.get(authTokensAtom);
          console.log("[Auth Mutation] Tokens BEFORE set:", beforeTokens);

          store.set(setAuthAtom, {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
          });

          console.log("[Auth Mutation] Tokens set, verifying...");

          // Verify tokens were set - wait a bit for async storage
          setTimeout(() => {
            const afterTokens = store.get(authTokensAtom);
            console.log("[Auth Mutation] Tokens AFTER set (100ms later):", afterTokens);
          }, 100);
        } else {
          console.log("[Auth Mutation] Missing tokens in result!");
        }
      },
      onError: (error) => {
        console.log("[Auth Mutation] onError:", error);
      },
      meta: {
        // successMessage: "Logged in successfully",
        redirectTo: "/",
        invalidatesQuery: [authKeys.me()]
      }
    }),

  refresh: () =>
    mutationOptions({
      mutationKey: authKeys.refresh(),
      mutationFn: async (options: CallOptions<typeof refreshContract>) => {
        // const result = await publicClient.call(refreshContract, options);

        // Update stored tokens
        // if (result.accessToken && result.refreshToken) {
        //   store.set(authTokensAtom, {
        //     accessToken: result.accessToken,
        //     refreshToken: result.refreshToken
        //   });
        // }

        // return result;
        throw new Error("Not implemented");
      },
      meta: {}
    }),

  logout: () =>
    mutationOptions({
      mutationKey: authKeys.logout(),
      mutationFn: async () => {
        // Clear tokens and user from Jotai atoms
        store.set(authTokensAtom, null);
        store.set(authUserAtom, null);
      },
      meta: {
        invalidatesQuery: [authKeys.me()]
      }
    })
};
