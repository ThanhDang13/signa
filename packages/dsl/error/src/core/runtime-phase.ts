/**
 * Represents the runtime phase during which an error occurred.
 * Used for lifecycle-aware error handling and logging.
 */
export type ErrorRuntimePhase = "bootstrap" | "http" | "worker" | "shutdown";

/**
 * Phase constants for convenience and type safety.
 */
export const RuntimePhase = {
  BOOTSTRAP: "bootstrap" as const,
  HTTP: "http" as const,
  WORKER: "worker" as const,
  SHUTDOWN: "shutdown" as const
} as const;
