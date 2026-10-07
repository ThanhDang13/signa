import { loginContract, signupContract, refreshContract } from "@signa/contracts-http/identity";
import { CallOptions } from "@signa/dsl-http-client";
import { loginFn, registerFn, refreshFn, logoutFn, meFn } from "@signa/web/lib/api/auth/auth";
import { createKeys } from "@signa/web/lib/tanstack/query-key";
import { Prettify } from "@signa/web/lib/types";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

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
    queryFn: () => meFn(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });

export const authMutations = {
  login: () =>
    mutationOptions({
      mutationKey: authKeys.login(),
      mutationFn: (options: Prettify<CallOptions<typeof loginContract>>) =>
        loginFn({ data: options }),
      meta: {
        successMessage: "Đăng nhập thành công",
        errorMessage: "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
        redirectTo: "/",
        invalidatesQuery: [authKeys.me()]
      }
    }),

  register: () =>
    mutationOptions({
      mutationKey: authKeys.register(),
      mutationFn: (options: CallOptions<typeof signupContract>) => registerFn({ data: options }),
      meta: {
        successMessage: "Đăng ký thành công",
        redirectTo: "/login"
      }
    }),

  refresh: () =>
    mutationOptions({
      mutationKey: authKeys.refresh(),
      mutationFn: (options: Prettify<CallOptions<typeof refreshContract>>) =>
        refreshFn({ data: options }),
      meta: {
        // No success toast for token refresh - silent operation
      }
    }),

  logout: () =>
    mutationOptions({
      mutationKey: authKeys.logout(),
      mutationFn: () => logoutFn(),
      meta: {
        successMessage: "Đã đăng xuất",
        invalidatesQuery: [authKeys.me()]
      }
    })
};
