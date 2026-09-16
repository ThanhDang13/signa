import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@signa/nest-config";
import { CONFIG_FACTORIES } from "./config.factory";

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
