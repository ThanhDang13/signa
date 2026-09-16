import { Injectable } from "@nestjs/common";
import { InjectConfig } from "@signa/nest-config";

import { NestJwtOptionsFactory, NestJwtOptions } from "@signa/nest-jwt";
import { JWT_CONFIG, type JwtConfig } from "@signa/api/core/config/tokens";

@Injectable()
export class SecurityConfig implements NestJwtOptionsFactory {
  constructor(
    @InjectConfig(JWT_CONFIG)
    private readonly config: JwtConfig
  ) {}

  create(): NestJwtOptions {
    return {
      secret: this.config.secret,
      expiresIn: this.config.expiresIn
    };
  }
}
