import { Module } from "@nestjs/common";
import { ConfigModule } from "@signa/worker/core/config/config.module";
import { ErrorModule } from "@signa/worker/core/error";
import { QueueModule } from "@signa/worker/core/queue";
import { S3Module } from "@signa/worker/core/s3";
import { BallotModule } from "@signa/worker/modules/ballot";
import { ScanningModule } from "@signa/worker/modules/scanning/scanning.module";

@Module({
  imports: [ConfigModule, ErrorModule, QueueModule, S3Module, BallotModule, ScanningModule]
})
export class AppModule {}
