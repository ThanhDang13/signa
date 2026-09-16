/**
 * HTTP request options passed to the adapter.
 */
export interface HttpRequestOptions {
  url: string;
  method: string;
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number; // Timeout in milliseconds
}

/**
 * HTTP adapter interface — the port that any HTTP client must implement.
 * Adapters are responsible for executing the actual HTTP request.
 */
export interface HttpAdapter {
  request<T>(options: HttpRequestOptions): Promise<T>;
  stream<T>(options: HttpRequestOptions): AsyncGenerator<T>;
}
