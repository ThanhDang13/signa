import type { HttpAdapter, HttpRequestOptions } from "@signa/dsl-http-client";

/**
 * Concrete HTTP adapter implementation using native fetch API.
 * Handles JSON serialization, headers, query parameters, timeout, and error handling.
 */
export const fetchAdapter: HttpAdapter = {
  async request<T>(options: HttpRequestOptions): Promise<T> {
    const { url: baseUrl, method, params, body, headers = {}, timeout } = options;

    let url = baseUrl;

    // Append query parameters to URL if present
    if (params) {
      const searchParams = new URLSearchParams(params as Record<string, string>);
      url = `${baseUrl}?${searchParams.toString()}`;
    }

    const requestHeaders: Record<string, string> = {
      ...headers
    };

    let requestBody: string | undefined;

    // Serialize body as JSON and set Content-Type header
    if (body !== undefined && body !== null) {
      requestBody = JSON.stringify(body);
      requestHeaders["Content-Type"] = "application/json";
    }

    // Setup timeout with AbortController
    const controller = new AbortController();
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : undefined;

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal
      });

      if (timeoutId) clearTimeout(timeoutId);

      // Parse response as JSON
      const responseData: unknown = await response.json().catch(() => null);

      // On non-2xx response, throw a plain object with status and data
      if (!response.ok) {
        throw {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        };
      }

      return responseData as T;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      // Handle timeout error
      if (error instanceof Error && error.name === "AbortError") {
        throw {
          status: 408,
          statusText: "Request Timeout",
          data: { error: { message: `Request timed out after ${timeout}ms` } }
        };
      }

      console.error("Fetch adapter error:", {
        url,
        method,
        error
      });

      throw error;
    }
  },

  async *stream<T>(options: HttpRequestOptions): AsyncGenerator<T> {
    const { url, method, body, headers = {}, timeout } = options;

    // Setup timeout with AbortController
    const controller = new AbortController();
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : undefined;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        };
      }

      if (!response.body) {
        throw {
          status: 500,
          statusText: "Internal Server Error",
          data: {
            error: {
              type: "infrastructure_error",
              message:
                "Infrastructure error: API returned 200 OK but the response body stream is empty. Streaming cannot be executed."
            }
          }
        };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          for (const line of decoder.decode(value, { stream: true }).split("\n")) {
            if (line.startsWith("data: ")) {
              yield JSON.parse(line.slice(6)) as T;
            }
          }
        }
      } finally {
        reader.releaseLock();
        if (timeoutId) clearTimeout(timeoutId);
      }
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      // Handle timeout error
      if (error instanceof Error && error.name === "AbortError") {
        throw {
          status: 408,
          statusText: "Request Timeout",
          data: { error: { message: `Stream timed out after ${timeout}ms` } }
        };
      }

      console.error("Fetch adapter stream error:", {
        url,
        method,
        error
      });

      throw error;
    }
  }
};
