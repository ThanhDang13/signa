import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "@signa/android/global.css";
import { PortalHost } from "@rn-primitives/portal";
import { getQueryClient } from "@signa/android/lib/tanstack/query-client";
import { useEffect } from "react";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import { NAV_THEME } from "@signa/android/lib/theme";
import { Theme, ThemeProvider } from "@react-navigation/native";
import { Toaster } from "@signa/android/components/ui/toaster";
import { getMeOptions } from "@signa/android/lib/tanstack/options/auth";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();

  // Query /me endpoint - single source of truth for auth state
  const { data: user, isLoading } = useQuery(getMeOptions());

  // Derive authentication status purely from query data
  const isAuthenticated = user !== undefined;
  const inAuthGroup = segments[0] === "(auth)";

  useEffect(() => {
    // Wait for initial query to complete
    if (isLoading) return;

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and not on auth screens -> redirect to login
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but on auth screens -> redirect to home
      router.replace("/");
    }
  }, [isAuthenticated, inAuthGroup, isLoading, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const theme = NAV_THEME[isDarkMode ? "dark" : "light"];

  return (
    <ThemeProvider value={theme}>
      <SafeAreaProvider>
        <QueryClientProvider client={getQueryClient()}>
          <JotaiProvider>
            <View style={{ flex: 1 }} className={isDarkMode ? "dark flex-1" : "flex-1"}>
              <AuthGuard>
                <View style={{ flex: 1 }} className="flex-1">
                  <Stack
                    screenOptions={{
                      headerShown: false
                    }}
                  />
                </View>
              </AuthGuard>
              <PortalHost />
              <Toaster position="top" offset={16} />
            </View>
          </JotaiProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
