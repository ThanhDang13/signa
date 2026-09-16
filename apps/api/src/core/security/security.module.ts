import { Global, Module } from "@nestjs/common";

import { NestJwtModule } from "@signa/nest-jwt";
import { SecurityConfig } from "@signa/api/core/security/security.config";

@Global()
@Module({
  imports: [
    NestJwtModule.registerAsync({
      useClass: SecurityConfig
    })
  ],
  exports: [NestJwtModule]
})
export class SecurityModule {}
