import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "../ports/token-service.port";
import { createError, defineError } from "@signa/dsl-error";

export interface JwtRequestContext {
  user?: JwtPayload;
}

const MISSING_AUTHENTICATED_USER = defineError({
  code: "MISSING_AUTHENTICATED_USER",
  category: "auth",
  messageKey: "auth.missing_authenticated_user",
  defaultMessage: "Missing authenticated user"
});

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): JwtPayload => {
  const req = ctx.switchToHttp().getRequest<JwtRequestContext>();
  if (!req.user) {
    throw createError(MISSING_AUTHENTICATED_USER.code);
  }
  return req.user;
});
export const OptionalUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload | null => {
    const req = ctx.switchToHttp().getRequest<JwtRequestContext>();
    return req.user ?? null;
  }
);
