import { Global, Module } from "@nestjs/common";
import { S3Module as NestS3Module } from "@signa/nest-s3";
import { S3ConfigService } from "./s3.config";
import { ConfigModule } from "@signa/api/core/config/config.module";

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
