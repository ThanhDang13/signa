import type { ErrorRuntimePhase } from "@signa/dsl-error";

/**
 * Global phase override.
 * When set, detectPhase() returns this value instead of heuristics.
 */
let phaseOverride: ErrorRuntimePhase | undefined;

/**
 * Detect the current runtime phase using heuristics.
 * Checks environment variables and process arguments.
 *
 * Heuristics:
 * - RUNTIME_PHASE env var (explicit override)
 * - WORKER_ID or WORKER_THREAD env var -> "worker"
 * - process.argv contains "migrate" or "seed" -> "bootstrap"
 * - Default: "http"
 */
export function detectPhase(): ErrorRuntimePhase {
  // Explicit override takes precedence
  if (phaseOverride) {
    return phaseOverride;
  }

  // Check environment variable
  const envPhase = process.env.RUNTIME_PHASE as ErrorRuntimePhase | undefined;
  if (envPhase && isValidPhase(envPhase)) {
    return envPhase;
  }

  // Check for worker indicators
  if (process.env.WORKER_ID || process.env.WORKER_THREAD) {
    return "worker";
  }

  // Check process arguments for bootstrap tasks
  const args = process.argv.join(" ");
  if (args.includes("migrate") || args.includes("seed") || args.includes("bootstrap")) {
    return "bootstrap";
  }

  // Default to http phase
  return "http";
}

/**
 * Set an explicit phase override.
 * This takes precedence over all heuristics.
 */
export function setPhase(phase: ErrorRuntimePhase): void {
  phaseOverride = phase;
}

/**
 * Get the current phase (either override or detected).
 */
export function getPhase(): ErrorRuntimePhase {
  return phaseOverride || detectPhase();
}

/**
 * Clear the phase override, returning to heuristic detection.
 */
export function clearPhase(): void {
  phaseOverride = undefined;
}

/**
 * Type guard to check if a string is a valid ErrorRuntimePhase.
 */
function isValidPhase(value: string): value is ErrorRuntimePhase {
  return ["bootstrap", "http", "worker", "shutdown"].includes(value);
}
