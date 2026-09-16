/**
 * Injection tokens for error handling infrastructure.
 */

/**
 * Token for injecting the ErrorDispatcher instance.
 * Used to route errors to phase-specific handlers.
 */
export const ERROR_DISPATCHER = Symbol("ERROR_DISPATCHER");

/**
 * Token for injecting the ErrorLogger instance.
 * Used for structured logging throughout the error handling pipeline.
 */
export const ERROR_LOGGER = Symbol("ERROR_LOGGER");
