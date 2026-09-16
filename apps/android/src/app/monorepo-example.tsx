import { Text, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';

interface MonorepoPackageCardProps {
  packageName: string;
  description: string;
  example: string;
}

function MonorepoPackageCard({
  packageName,
  description,
  example,
}: MonorepoPackageCardProps) {
  return (
    <View className="bg-white border border-blue-200 rounded-xl p-4 mb-3">
      <Text className="text-base font-semibold text-gray-900 mb-2">
        {packageName}
      </Text>
      <Text className="text-sm text-gray-600 mb-3">
        {description}
      </Text>
      <View className="bg-gray-50 p-3 rounded-lg">
        <Text className="text-xs font-mono text-gray-700">
          {example}
        </Text>
      </View>
    </View>
  );
}

export default function MonorepoExampleScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Monorepo Packages
        </Text>

        <MonorepoPackageCard
          packageName="@signa/contracts-http"
          description="HTTP contract definitions with Zod schemas for type-safe API communication"
          example="import type { UsersContract } from '@signa/contracts-http';"
        />

        <MonorepoPackageCard
          packageName="@signa/runtime-fetch-client"
          description="Type-safe fetch client that consumes contract definitions"
          example="const client = createClient<Contract>({ baseUrl });"
        />

        <MonorepoPackageCard
          packageName="@signa/runtime-error"
          description="Standardized error handling across the application"
          example="import { ApiError } from '@signa/runtime-error';"
        />

        <MonorepoPackageCard
          packageName="@signa/shared"
          description="Shared utilities and types used across all packages"
          example="import { someUtil } from '@signa/shared';"
        />

        <View className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <Text className="text-sm font-semibold text-green-900 mb-2">
            ✅ End-to-End Type Safety
          </Text>
          <Text className="text-xs text-green-800">
            Changes to contracts are immediately reflected in the mobile app with full TypeScript support.
            No code generation needed!
          </Text>
        </View>

        <Pressable
          className="mt-6 bg-blue-500 px-6 py-4 rounded-xl active:bg-blue-600"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold text-center text-lg">
            ← Back to Home
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
