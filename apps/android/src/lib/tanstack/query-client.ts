import { Route, router } from "expo-router";
import { MutationCache, QueryClient, QueryClientConfig, QueryKey } from "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidatesQuery?: QueryKey[];
      refetchQuery?: QueryKey[];
      removeQuery?: QueryKey[];
      successMessage?: string;
      errorMessage?: string;
      redirectTo?: Route;
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
      onSuccess: async (_data, _variables, _context, mutation) => {
        // TODO: Add toast/snackbar notification here
        // if (mutation.meta?.successMessage) {
        //   showSnackbar(mutation.meta.successMessage, "success");
        // }

        // Refetch queries that need immediate data (e.g., /me after login)
        const refetchKeys = mutation.meta?.refetchQuery;
        if (refetchKeys) {
          const list = Array.isArray(refetchKeys) ? refetchKeys : [refetchKeys];
          await Promise.all(list.map((queryKey) => queryClient.refetchQueries({ queryKey })));
        }

        if (mutation.meta?.redirectTo) {
          if (mutation.meta.replace) {
            router.replace(mutation.meta.redirectTo);
          } else {
            router.push(mutation.meta.redirectTo);
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
        // Remove queries (e.g., logout should clear /me cache)
        const removeKeys = mutation.meta?.removeQuery;
        if (removeKeys) {
          const list = Array.isArray(removeKeys) ? removeKeys : [removeKeys];
          list.forEach((queryKey) => queryClient.removeQueries({ queryKey }));
        }

        const keys = mutation.meta?.invalidatesQuery;
        if (!keys) return;

        const list = Array.isArray(keys) ? keys : [keys];
        list.forEach((queryKey) => {
          queryClient.refetchQueries({ queryKey });
        });
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
