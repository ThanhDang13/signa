import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@signa/android/components/ui/text";
import { Button } from "@signa/android/components/ui/button";
import { Icon } from "@signa/android/components/ui/icon";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { authMutations } from "@signa/android/lib/tanstack/options/auth";
import { ThemeToggle } from "@signa/android/components/theme-toggle";
import { ArrowLeft, Moon, LogOut, HelpCircle, Info } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import Constants from "expo-constants";

export default function SettingsScreen() {
  const router = useRouter();
  const logoutMutation = useMutation(authMutations.logout());
  const { colorScheme } = useColorScheme();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleContactSupport = () => {
    // TODO: Add contact support functionality (email, phone, or in-app support)
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />

      <ScrollView className="flex-1">
        <View className="flex-1 px-6 pt-12">
          {/* Header with Back Button */}
          <View className="mb-8 flex-row items-center">
            <Button variant="ghost" size="icon" onPress={() => router.back()} className="mr-4">
              <Icon as={ArrowLeft} size={24} className="text-foreground" />
            </Button>
            <Text className="text-2xl font-bold text-foreground">Cài đặt</Text>
          </View>

          {/* Appearance Section */}
          <View className="mb-6">
            <Text className="mb-3 text-sm font-medium text-muted-foreground">GIAO DIỆN</Text>
            <View className="rounded-lg border border-border bg-card p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Icon as={Moon} size={20} className="text-foreground" />
                  <View>
                    <Text className="font-medium text-foreground">Chế độ tối</Text>
                    <Text className="text-sm text-muted-foreground">
                      {colorScheme === "dark" ? "Đang bật" : "Đang tắt"}
                    </Text>
                  </View>
                </View>
                <ThemeToggle />
              </View>
            </View>
          </View>

          {/* Account Section */}
          <View className="mb-6">
            <Text className="mb-3 text-sm font-medium text-muted-foreground">TÀI KHOẢN</Text>
            <View className="rounded-lg border border-border bg-card">
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center gap-3 p-4 active:bg-muted"
              >
                <Icon as={LogOut} size={20} className="text-destructive" />
                <Text className="font-medium text-destructive">Đăng xuất</Text>
              </Pressable>
            </View>
          </View>

          {/* Help & Support Section */}
          <View className="mb-6">
            <Text className="mb-3 text-sm font-medium text-muted-foreground">HỖ TRỢ</Text>
            <View className="rounded-lg border border-border bg-card">
              <Pressable
                onPress={handleContactSupport}
                className="flex-row items-center justify-between border-b border-border p-4 active:bg-muted"
              >
                <View className="flex-row items-center gap-3">
                  <Icon as={HelpCircle} size={20} className="text-foreground" />
                  <Text className="font-medium text-foreground">Liên hệ hỗ trợ</Text>
                </View>
              </Pressable>
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-3">
                  <Icon as={Info} size={20} className="text-foreground" />
                  <Text className="font-medium text-foreground">Phiên bản</Text>
                </View>
                <Text className="text-sm text-muted-foreground">
                  {Constants.expoConfig?.version || "1.0.0"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
