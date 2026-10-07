import { bindNavigator } from "@signa/web/lib/tanstack/navigation";
import { getQueryClient } from "@signa/web/lib/tanstack/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "@signa/web/routeTree.gen";
import { createRouter } from "@tanstack/react-router";
import { ThemeProvider } from "@signa/web/components/theme/theme-provider";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    context: { queryClient: getQueryClient() },
    defaultPreload: "intent",
    defaultStaleTime: Infinity
  });

  return router;
}

bindNavigator((to, replace) => {
  getRouter().navigate({ to, replace });
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="theme">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
