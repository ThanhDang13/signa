import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import type { ContextProvider } from "@signa/dsl-policy";

/**
 * NestJS implementation of ContextProvider for HTTP requests.
 *
 * Resolves policy context from NestJS ExecutionContext by reading:
 * - subject: request.user
 * - scopes: request.scopes
 * - environment: request.extras (or custom environment data)
 */
@Injectable()
export class NestContextProvider implements ContextProvider<ExecutionContext> {
  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Resolve the subject (authenticated user) from the HTTP request. (Return none required resolver)
   */
  resolveSubject(ctx: ExecutionContext): unknown {
    return;
  }

  /**
   * Resolve scopes from the HTTP request.
   */
  resolveScopes(ctx: ExecutionContext): readonly string[] {
    const request = ctx.switchToHttp().getRequest<any>();
    return request.scopes ?? [];
  }

  /**
   * Resolve environment context from the HTTP request.
   * Returns request.extras or an empty object.
   */
  resolveEnvironment(ctx: ExecutionContext): Record<string, unknown> {
    const request = ctx.switchToHttp().getRequest<any>();
    return request.extras ?? {};
  }
}
