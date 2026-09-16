import { Injectable, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtPayload } from "../ports/token-service.port";
import { NEST_JWT_OPTIONS, type NestJwtOptions } from "../jwt.module-options";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(@Inject(NEST_JWT_OPTIONS) options: NestJwtOptions) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: options.secret
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return payload;
  }
}
