import { Module } from "@nestjs/common";
import { QueueModule as NestQueueModule } from "@signa/nest-queue";
import { ConfigModule } from "@signa/worker/core/config/config.module";
import { QueueConfigService } from "./queue.config";
import { QueueReadinessService } from "./queue-readiness.service";

@Module({
  imports: [
    NestQueueModule.registerAsync({
      imports: [ConfigModule],
      useClass: QueueConfigService
    })
  ],
  providers: [QueueReadinessService],
  exports: [NestQueueModule]
})
export class QueueModule {}
