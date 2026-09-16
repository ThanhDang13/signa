import { Global, Module } from "@nestjs/common";
import { S3Module as NestS3Module } from "@signa/nest-s3";
import { ConfigModule } from "@signa/worker/core/config/config.module";
import { S3ConfigService } from "./s3.config";

@Global()
@Module({
  imports: [
    NestS3Module.registerAsync({
      imports: [ConfigModule],
      useClass: S3ConfigService
    })
  ],
  exports: [NestS3Module]
})
export class S3Module {}
