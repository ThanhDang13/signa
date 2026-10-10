import type { ReactNode } from "react";
import "@signa/web/styles/app.css";

import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  createRootRouteWithContext
} from "@tanstack/react-router";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Providers from "@signa/web/router";
import { Toaster } from "@signa/react-ui/components/ui/sonner";
import { prefetchAndDehydrate } from "@signa/web/lib/tanstack/prefetch";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "Signa"
      },
      {
        links: [{ rel: "icon", href: "/favicon.ico", sizes: "32x32" }]
      }
    ]
  }),
  loader: async ({ context }) => {
    return prefetchAndDehydrate(context.queryClient, []);
  },
  component: RootComponent
});

function RootComponent() {
  const context = Route.useRouteContext();

  return (
    <RootDocument>
      <Providers>
        <HydrationBoundary state={dehydrate(context.queryClient)}>
          <Outlet />
          <Toaster />
        </HydrationBoundary>
        <ReactQueryDevtools initialIsOpen={false} />
      </Providers>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="h-screen w-screen overflow-hidden" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body
        className="bg-background flex h-full w-full flex-col antialiased"
        suppressHydrationWarning
      >
        {children}
        <Scripts />
      </body>
    </html>
  );
}
