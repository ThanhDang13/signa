import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';

/**
 * Example hook demonstrating integration with @signa/runtime-fetch-client
 * and @signa/contracts-http for end-to-end type safety.
 *
 * Uncomment and adapt when you're ready to connect to your API:
 *
 * import { createClient } from '@signa/runtime-fetch-client';
 * import type { SomeContract } from '@signa/contracts-http';
 */

// Example: Type-safe API hook using TanStack Query
export function useApiExample() {
  return useQuery({
    queryKey: ['api-example'],
    queryFn: async () => {
      // TODO: Replace with your actual API client
      // const client = createClient<SomeContract>({ baseUrl: 'https://api.example.com' });
      // return client.someEndpoint();

      // Placeholder for demonstration
      return {
        message: 'Replace this with your @signa/runtime-fetch-client implementation',
        timestamp: new Date().toISOString(),
      };
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Example mutation hook for POST/PUT/DELETE operations
 */
export function useApiMutation() {
  return useMutation({
    mutationFn: async (data: { value: string }) => {
      // TODO: Replace with your actual API client
      // const client = createClient<SomeContract>({ baseUrl: 'https://api.example.com' });
      // return client.createSomething(data);

      return { success: true, data };
    },
    onSuccess: (data) => {
      console.log('Mutation successful:', data);
    },
    onError: (error) => {
      console.error('Mutation failed:', error);
    },
  });
}

/**
 * Generic hook factory for creating type-safe API hooks
 *
 * @example
 * ```ts
 * import { createClient } from '@signa/runtime-fetch-client';
 * import type { UsersContract } from '@signa/contracts-http';
 *
 * const client = createClient<UsersContract>({ baseUrl: API_URL });
 *
 * export const useUsers = () => createApiQuery(
 *   ['users'],
 *   () => client.getUsers()
 * );
 * ```
 */
export function createApiQuery<TData>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}
