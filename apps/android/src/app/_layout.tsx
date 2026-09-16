import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "@signa/android/global.css";
import { PortalHost } from "@rn-primitives/portal";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000 // 10 minutes
    }
  }
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: "#f8f9fa"
              },
              headerTintColor: "#1f2937",
              headerTitleStyle: {
                fontWeight: "600"
              }
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                title: "Signa"
              }}
            />
            <Stack.Screen
              name="monorepo-example"
              options={{
                title: "Monorepo Packages"
              }}
            />
          </Stack>
          <PortalHost />
        </JotaiProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
