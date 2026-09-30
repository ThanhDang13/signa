import { useState } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { Text } from "@signa/android/components/ui/text";
import { Input } from "@signa/android/components/ui/input";
import { Button } from "@signa/android/components/ui/button";
import { Label } from "@signa/android/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { authMutations } from "@signa/android/lib/tanstack/options/auth";
import { StatusBar } from "expo-status-bar";
import { z } from "zod";
import { ThemeToggle } from "@signa/android/components/theme-toggle";
import { useColorScheme } from "nativewind";

const loginSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự")
});

type FormErrors = {
  email?: string;
  password?: string;
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const { colorScheme } = useColorScheme();

  const loginMutation = useMutation(authMutations.login());

  const handleLogin = () => {
    // Validate with Zod
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const tree = z.treeifyError(result.error);
      setErrors({
        email: tree.properties?.email?.errors?.[0],
        password: tree.properties?.password?.errors?.[0]
      });
      return;
    }

    // Clear errors and submit
    setErrors({});
    loginMutation.mutate({
      body: {
        email,
        password
      }
    });
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />

      <ScrollView className="flex-1" contentContainerClassName="flex-1">
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="mb-12 items-center gap-3">
            <Text className="text-4xl font-bold text-foreground">Chào mừng trở lại</Text>
            <Text className="text-lg text-muted-foreground">Đăng nhập vào tài khoản của bạn</Text>
          </View>

          {/* Form */}
          <View className="gap-6">
            {/* Email Input */}
            <View className="gap-2">
              <Label>Email</Label>
              <Input
                placeholder="Nhập email của bạn"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                aria-invalid={!!errors.email}
              />
              {errors.email && <Text className="text-sm text-destructive">{errors.email}</Text>}
            </View>

            {/* Password Input */}
            <View className="gap-2">
              <Label>Mật khẩu</Label>
              <Input
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <Text className="text-sm text-destructive">{errors.password}</Text>
              )}
            </View>

            {/* API Error Message */}
            {loginMutation.isError && (
              <View className="rounded-lg bg-destructive/10 p-4">
                <Text className="text-sm text-destructive">
                  {loginMutation.error?.message || "Đăng nhập thất bại. Vui lòng thử lại."}
                </Text>
              </View>
            )}

            {/* Login Button */}
            <Button
              className="mt-2"
              variant="default"
              size="lg"
              onPress={handleLogin}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <ActivityIndicator
                  size="small"
                  color={colorScheme === "dark" ? "#000000" : "#ffffff"}
                />
              ) : (
                <Text>Đăng nhập</Text>
              )}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
