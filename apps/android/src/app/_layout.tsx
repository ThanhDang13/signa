import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider, useAtomValue, useSetAtom } from "jotai";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "@signa/android/global.css";
import { PortalHost } from "@rn-primitives/portal";
import { getQueryClient } from "@signa/android/lib/tanstack/query-client";
import { authTokensAtom, initAuthAtom } from "@signa/android/lib/atoms/auth";
import { useEffect } from "react";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import { NAV_THEME } from "@signa/android/lib/theme";
import { Theme, ThemeProvider } from "@react-navigation/native";
import { Toaster } from "@signa/android/components/ui/toaster";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const tokens = useAtomValue(authTokensAtom);
  const segments = useSegments();
  const router = useRouter();
  const initAuth = useSetAtom(initAuthAtom);

  // Initialize auth from storage on mount
  useEffect(() => {
    console.log("[AuthGuard] Initializing auth from storage");
    initAuth();
  }, [initAuth]);

  // Derive authentication status synchronously from tokens
  const isAuthenticated = tokens !== null && tokens?.accessToken !== "";

  console.log("[AuthGuard] Render:", {
    tokens: tokens ? { hasAccess: !!tokens.accessToken, hasRefresh: !!tokens.refreshToken } : null,
    isAuthenticated,
    segments,
    inAuthGroup: segments[0] === "(auth)"
  });

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";

    console.log("[AuthGuard] Effect triggered:", {
      isAuthenticated,
      inAuthGroup,
      segments
    });

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and not on auth screens -> redirect to login
      console.log("[AuthGuard] Redirecting to login - not authenticated");
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but on auth screens -> redirect to home
      console.log("[AuthGuard] Redirecting to home - authenticated in auth group");
      router.replace("/");
    }
  }, [isAuthenticated, segments, router]);

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
