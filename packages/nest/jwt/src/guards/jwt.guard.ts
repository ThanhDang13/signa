import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { JwtPayload } from "../ports/token-service.port";
import { createError } from "@signa/dsl-error";
import { USER_MISSING } from "../errors/error-codes";

@Injectable()
export class JwtIdentityGuard extends AuthGuard("jwt") {
  override handleRequest<TUser = JwtPayload | null>(
    _err: unknown,
    user: JwtPayload | false | null
  ): TUser {
    return (user || null) as TUser;
  }

  override canActivate(context: ExecutionContext) {
    return super.canActivate(context) as boolean;
  }
}

@Injectable()
export class JwtProtectedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const user = req.user as JwtPayload | null;

    if (!user) {
      throw createError(USER_MISSING.code);
    }

    return true;
  }
}
