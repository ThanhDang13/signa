import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@signa/nest-config";
import { CONFIG_FACTORIES } from "@signa/api/core/config/app.config";

@Module({
  imports: [
    NestConfigModule.register({
      factories: [...CONFIG_FACTORIES],
      env: process.env
    })
  ],
  exports: [NestConfigModule]
})
export class ConfigModule {}
