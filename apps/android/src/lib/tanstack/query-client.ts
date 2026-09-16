import { router } from "expo-router";
import {
  MutationCache,
  QueryClient,
  QueryClientConfig,
  QueryKey
} from "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidatesQuery?: QueryKey[];
      successMessage?: string;
      errorMessage?: string;
      redirectTo?: string;
      replace?: boolean;
    };
  }
}

const queryDefaultOptions = {
  queries: {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  }
} satisfies QueryClientConfig["defaultOptions"];

function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: queryDefaultOptions,
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        // TODO: Add toast/snackbar notification here
        // if (mutation.meta?.successMessage) {
        //   showSnackbar(mutation.meta.successMessage, "success");
        // }

        if (mutation.meta?.redirectTo) {
          if (mutation.meta.replace) {
            router.replace(mutation.meta.redirectTo as any);
          } else {
            router.push(mutation.meta.redirectTo as any);
          }
        }
      },

      onError: (err, _vars, _ctx, mutation) => {
        //TODO: handle error mapping
        // TODO: Add toast/snackbar notification here
        // const message = mutation.meta?.errorMessage || "An error occurred";
        // showSnackbar(message, "error");
      },

      onSettled: (_data, _error, _variables, _context, mutation) => {
        const keys = mutation.meta?.invalidatesQuery;
        if (!keys) return;

        const list = Array.isArray(keys) ? keys : [keys];
        list.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      }
    })
  });

  return queryClient;
}

let queryClientInstance: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (!queryClientInstance) queryClientInstance = makeQueryClient();
  return queryClientInstance;
}
