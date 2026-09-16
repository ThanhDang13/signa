import { Global, Module } from "@nestjs/common";

import { ErrorNestModule } from "@signa/nest-error";
import { ErrorConfig } from "@signa/api/core/error/error.config";

@Global()
@Module({
  imports: [
    ErrorNestModule.registerAsync({
      useClass: ErrorConfig
    })
  ],
  exports: [ErrorNestModule]
})
export class ErrorModule {}
