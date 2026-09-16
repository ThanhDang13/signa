import { Global, Module } from "@nestjs/common";
import { QueueModule as NestQueueModule } from "@signa/nest-queue";
import { QueueConfigService } from "@signa/api/core/queue/queue.config";

@Global()
@Module({
  imports: [
    NestQueueModule.registerAsync({
      useClass: QueueConfigService
    })
  ],
  exports: [NestQueueModule]
})
export class QueueModule {}
