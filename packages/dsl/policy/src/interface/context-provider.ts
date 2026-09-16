/**
 * Abstraction for resolving policy context from a transport-specific execution context.
 *
 * This interface allows policies to work across different transports (HTTP, gRPC, events, etc.)
 * by delegating context resolution to transport-specific implementations.
 *
 * @template TTransportContext - The transport-specific execution context (e.g., NestJS ExecutionContext, gRPC metadata)
 *
 * @example
 * ```typescript
 * // NestJS HTTP implementation
 * class NestContextProvider implements ContextProvider<ExecutionContext> {
 *   async resolveSubject(ctx) {
 *     return ctx.switchToHttp().getRequest().user;
 *   }
 *
 *   async resolveScopes(ctx) {
 *     return ctx.switchToHttp().getRequest().scopes ?? [];
 *   }
 *
 *   async resolveResource(ctx) {
 *     // Optional: resolve resource from route params, body, etc.
 *   }
 *
 *   async resolveEnvironment(ctx) {
 *     return {
 *       ip: ctx.switchToHttp().getRequest().ip,
 *       userAgent: ctx.switchToHttp().getRequest().get('user-agent')
 *     };
 *   }
 * }
 * ```
 */
export interface ContextProvider<TTransportContext = unknown> {
  /**
   * Resolve the subject (user/actor) from the transport context.
   * @param ctx Transport-specific execution context
   * @returns The subject (user/actor) or undefined if not authenticated
   */
  resolveSubject(ctx: TTransportContext): Promise<unknown> | unknown;

  /**
   * Resolve the scopes/permissions from the transport context.
   * @param ctx Transport-specific execution context
   * @returns Array of scopes the subject has access to
   */
  resolveScopes(ctx: TTransportContext): Promise<readonly string[]> | readonly string[];

  /**
   * Optionally resolve the resource being accessed from the transport context.
   * @param ctx Transport-specific execution context
   * @returns The resource or undefined if not applicable
   */
  resolveResource?(ctx: TTransportContext): Promise<unknown> | unknown;

  /**
   * Optionally resolve environment context (IP, user agent, etc.) from the transport context.
   * @param ctx Transport-specific execution context
   * @returns Environment metadata or undefined
   */
  resolveEnvironment?(
    ctx: TTransportContext
  ): Promise<Record<string, unknown>> | Record<string, unknown>;
}
