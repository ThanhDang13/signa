import {
  createClerkContract,
  listClerksContract,
  updateClerkContract,
  deleteClerkContract,
  resetClerkPasswordContract
} from "@signa/contracts-http/identity";
import { CallOptions } from "@signa/dsl-http-client";
import {
  listClerksFn,
  createClerkFn,
  updateClerkFn,
  deleteClerkFn,
  resetClerkPasswordFn
} from "@signa/web/lib/api/clerk/clerk";
import { createKeys } from "@signa/web/lib/tanstack/query-key";
import { Prettify } from "@signa/web/lib/types";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

export const clerkKeys = createKeys("clerk", {
  all: () => [] as const,
  list: (query?: CallOptions<typeof listClerksContract>) => ["list", query] as const
});

export const listClerksOptions = (options: Prettify<CallOptions<typeof listClerksContract>>) =>
  queryOptions({
    queryKey: clerkKeys.list(options),
    queryFn: () => listClerksFn({ data: options })
  });

export const clerkMutations = {
  create: () =>
    mutationOptions({
      mutationFn: (options: Prettify<CallOptions<typeof createClerkContract>>) =>
        createClerkFn({ data: options }),
      meta: {
        successMessage: "Tạo kiểm phiếu viên thành công",
        errorMessage: "Tạo kiểm phiếu viên thất bại",
        invalidatesQuery: [clerkKeys.all()]
      }
    }),

  update: () =>
    mutationOptions({
      mutationFn: (options: Prettify<CallOptions<typeof updateClerkContract>>) =>
        updateClerkFn({ data: options }),
      meta: {
        successMessage: "Cập nhật kiểm phiếu viên thành công",
        errorMessage: "Cập nhật kiểm phiếu viên thất bại",
        invalidatesQuery: [clerkKeys.all()]
      }
    }),

  delete: () =>
    mutationOptions({
      mutationFn: (options: Prettify<CallOptions<typeof deleteClerkContract>>) =>
        deleteClerkFn({ data: options }),
      meta: {
        successMessage: "Xóa kiểm phiếu viên thành công",
        errorMessage: "Xóa kiểm phiếu viên thất bại",
        invalidatesQuery: [clerkKeys.all()]
      }
    }),

  resetPassword: () =>
    mutationOptions({
      mutationFn: (options: Prettify<CallOptions<typeof resetClerkPasswordContract>>) =>
        resetClerkPasswordFn({ data: options }),
      meta: {
        successMessage: "Đặt lại mật khẩu thành công",
        errorMessage: "Đặt lại mật khẩu thất bại",
        invalidatesQuery: [clerkKeys.all()]
      }
    })
};
