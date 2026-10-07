import {
  loginContract,
  signupContract,
  refreshContract,
  getCurrentUserContract
} from "@signa/contracts-http/identity";
import { CallOptions } from "@signa/dsl-http-client";
import { clearAuthCookies, publicClient, setAuthCookies, withAuth } from "@signa/web/lib/api/api";
import { createServerFn } from "@tanstack/react-start";

const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30;

/**
 * POST /v1/auth/login - Login
 */
export const loginFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof loginContract>) => data)
  .handler(async ({ data }) => {
    const result = await publicClient.call(loginContract, {
      body: data.body
    });

    if (result.accessToken && result.refreshToken) {
      setAuthCookies(result.accessToken, result.refreshToken, REFRESH_TOKEN_TTL);
    }

    return result;
  });

/**
 * POST /v1/auth/signup - Signup
 */
export const registerFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof signupContract>) => data)
  .handler(async ({ data }) => {
    const result = await publicClient.call(signupContract, {
      body: data.body
    });

    return result;
  });

/**
 * POST /v1/auth/refresh - Refresh access token
 */
export const refreshFn = createServerFn({ method: "POST" })
  .validator((data: CallOptions<typeof refreshContract>) => data)
  .handler(async ({ data }) => {
    const result = await publicClient.call(refreshContract, {
      body: data.body
    });

    if (result.accessToken && result.refreshToken) {
      setAuthCookies(result.accessToken, result.refreshToken, REFRESH_TOKEN_TTL);
    }

    return result;
  });

/**
 * POST /v1/auth/logout - Logout (server-safe cookie clear)
 */
export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  clearAuthCookies();
  return { ok: true };
});

/**
 * GET /v1/auth/me - Get current user's auth context
 */
export const meFn = createServerFn({ method: "GET" }).handler(async () => {
  return withAuth(async (api) => {
    return api.call(getCurrentUserContract, {});
  });
});
