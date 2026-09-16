import { Text, View, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Alert, AlertTitle, AlertDescription } from "@signa/android/components/ui/alert";
import { CheckCircle, Info } from "lucide-react-native";
import { ROLES } from "@signa/shared";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      <ScrollView className="flex-1">
        <View className="flex-1 items-center justify-center gap-4 p-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">Signa</Text>
            <Text className="text-lg text-muted-foreground">React Native + Expo</Text>
          </View>

          {/* Alert Component Demo */}
          <View className="mt-8 w-full max-w-md">
            <Alert icon={CheckCircle}>
              <AlertTitle>Workspace Dependencies Working!</AlertTitle>
              <AlertDescription>
                Successfully imported ROLES from @signa/shared: {ROLES.USER} and {ROLES.SUPER_ADMIN}
              </AlertDescription>
            </Alert>
          </View>

          {/* Info Alert */}
          <View className="mt-4 w-full max-w-md">
            <Alert icon={Info} variant="destructive">
              <AlertTitle>Setup Complete</AlertTitle>
              <AlertDescription>
                Your React Native app is fully configured with NativeWind, React Native Reusables
                components, and monorepo package imports!
              </AlertDescription>
            </Alert>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
