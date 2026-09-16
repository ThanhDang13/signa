import type {
  Contract,
  InferBodyInput,
  InferParams,
  InferParamsInput,
  InferQueryInput,
  InferResponse
} from "@signa/dsl-http-contract";
import { buildPath } from "@signa/dsl-http-contract";
import type { HttpAdapter, HttpRequestOptions } from "../core/http-adapter";
import type { RequestHeaders } from "../core/request-headers";

export interface ClientOptions {
  adapter: HttpAdapter;
  baseUrl: string;
  getHeaders?: () => RequestHeaders | Promise<RequestHeaders>;
  timeout?: number; // Default timeout in milliseconds
  retry?: { attempts: number; delay?: number; when?: (status: number) => boolean };
  onRequest?: (options: HttpRequestOptions) => HttpRequestOptions;
  onResponse?: <T>(data: T) => T;
  onError?: (status: number, data: unknown) => never;
}

export type CallOptions<T extends Contract> = (InferParamsInput<T> extends never
  ? { params?: never }
  : { params: InferParamsInput<T> }) &
  (InferQueryInput<T> extends never ? { query?: never } : { query: InferQueryInput<T> }) &
  (InferBodyInput<T> extends never ? { body?: never } : { body: InferBodyInput<T> }) & {
    timeout?: number; // Per-request timeout override
  };

export function createClient(options: ClientOptions) {
  const {
    adapter,
    baseUrl,
    getHeaders,
    timeout: defaultTimeout,
    retry,
    onRequest,
    onResponse,
    onError
  } = options;

  const buildRequestOptions = async <T extends Contract>(
    contract: T,
    callOptions?: CallOptions<T>
  ): Promise<HttpRequestOptions> => {
    const path =
      callOptions?.params !== undefined
        ? buildPath(contract, callOptions.params as NonNullable<InferParams<T>>)
        : buildPath(contract);

    const url = new URL(baseUrl + path);

    if (callOptions?.query) {
      const query = callOptions.query as Record<string, unknown>;
      for (const [key, value] of Object.entries(query)) {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    let headers: Record<string, string> = {};
    if (getHeaders) {
      const dynamicHeaders = await getHeaders();
      headers = { ...(dynamicHeaders as Record<string, string>) };
    }

    let requestOptions: HttpRequestOptions = {
      url: url.toString(),
      method: contract.method,
      body: callOptions?.body,
      headers,
      timeout: callOptions?.timeout ?? defaultTimeout // Per-request timeout or default
    };

    if (onRequest) {
      requestOptions = onRequest(requestOptions);
    }

    return requestOptions;
  };

  return {
    call: <T extends Contract>(
      contract: T,
      ...args: keyof CallOptions<T> extends never
        ? [options?: CallOptions<T>]
        : [options: CallOptions<T>]
    ): Promise<InferResponse<T>> => {
      const callOptions = args[0];

      const attemptRequest = async (attemptsRemaining: number): Promise<InferResponse<T>> => {
        try {
          const requestOptions = await buildRequestOptions(contract, callOptions);
          const response = await adapter.request<InferResponse<T>>(requestOptions);

          if (onResponse) {
            return onResponse(response);
          }

          return response;
        } catch (error) {
          if (error && typeof error === "object" && "status" in error) {
            const httpError = error as { status: number; data: unknown };
            const shouldRetry = retry?.when?.(httpError.status) ?? false;

            if (shouldRetry && attemptsRemaining > 0) {
              const delayMs = retry?.delay ?? 0;
              if (delayMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
              }
              return attemptRequest(attemptsRemaining - 1);
            }

            if (onError) {
              onError(httpError.status, httpError.data);
            }
          }

          throw error;
        }
      };

      return attemptRequest(retry?.attempts ?? 0);
    },

    stream: async function* <T extends Contract>(
      contract: T,
      ...args: keyof CallOptions<T> extends never
        ? [options?: CallOptions<T>]
        : [options: CallOptions<T>]
    ): AsyncGenerator<InferResponse<T>> {
      const requestOptions = await buildRequestOptions(contract, args[0]);
      yield* adapter.stream<InferResponse<T>>(requestOptions);
    }
  };
}
