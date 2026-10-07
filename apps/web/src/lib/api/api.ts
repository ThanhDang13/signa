// api.server.ts
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createClient } from "@signa/dsl-http-client";
import { fetchAdapter } from "@signa/runtime-fetch-client";
import { refreshContract } from "@signa/contracts-http/identity";
import env from "@signa/web/lib/config/env.server";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30;

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/"
};

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

export function setAuthCookies(accessToken: string, refreshToken: string, accessTokenTtl: number) {
  setCookie(ACCESS_TOKEN_COOKIE, accessToken, { ...cookieOptions, maxAge: accessTokenTtl });
  setCookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_TTL });
}

export function clearAuthCookies() {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
}

function isUnauthorized(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status: unknown }).status === 401
  );
}

async function refreshAndRetry<T>(
  fn: (api: ReturnType<typeof createApiClient>) => Promise<T>,
  refreshToken: string
): Promise<T> {
  try {
    const result = await publicClient.call(refreshContract, { body: { refreshToken } });

    setAuthCookies(result.accessToken, result.refreshToken, REFRESH_TOKEN_TTL);

    return await fn(createApiClient(result.accessToken));
  } catch {
    clearAuthCookies();
    throw { status: 401, error: { message: "Session expired" } };
  }
}

export async function withAuth<T>(
  fn: (api: ReturnType<typeof createApiClient>) => Promise<T>
): Promise<T> {
  const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
  const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);

  if (!accessToken) {
    if (!refreshToken) throw { status: 401, error: { message: "Unauthenticated" } };
    return refreshAndRetry(fn, refreshToken);
  }

  try {
    return await fn(createApiClient(accessToken));
  } catch (err) {
    if (isUnauthorized(err) && refreshToken) {
      return refreshAndRetry(fn, refreshToken);
    }
    throw err;
  }
}

export async function* withAuthStream<T>(
  fn: (api: ReturnType<typeof createApiClient>) => AsyncGenerator<T>
): AsyncGenerator<T> {
  const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
  const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);

  if (!accessToken) {
    if (!refreshToken) throw { status: 401, error: { message: "Unauthenticated" } };
    const result = await publicClient.call(refreshContract, { body: { refreshToken } });
    setAuthCookies(result.accessToken, result.refreshToken, REFRESH_TOKEN_TTL);
    yield* fn(createApiClient(result.accessToken));
    return;
  }

  yield* fn(createApiClient(accessToken));
}
