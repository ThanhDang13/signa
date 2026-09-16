export interface RequestHeaders {
  Authorization?: `Bearer ${string}`;
  "Content-Type"?: "application/json" | "multipart/form-data";
  Accept?: string;
  "X-Request-ID"?: string;
  "X-Correlation-ID"?: string;
}
