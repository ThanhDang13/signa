import { navigate } from "@signa/web/lib/tanstack/navigation";
import {
  environmentManager,
  MutationCache,
  QueryClient,
  QueryClientConfig,
  QueryKey
} from "@tanstack/react-query";
import { toast } from "sonner";

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

function makeServerQueryClient() {
  return new QueryClient({ defaultOptions: queryDefaultOptions });
}

function makeBrowserQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: queryDefaultOptions,
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        if (mutation.meta?.successMessage) {
          toast.success(mutation.meta.successMessage);
        }

        if (mutation.meta?.redirectTo) {
          navigate(mutation.meta.redirectTo, mutation.meta.replace);
        }
      },

      onError: (err, _vars, _ctx, mutation) => {
        //TODO: handle error mapping
        const message = mutation.meta?.errorMessage;
        toast.error(message);
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

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeServerQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeBrowserQueryClient();
    return browserQueryClient;
  }
}
