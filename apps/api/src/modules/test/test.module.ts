import { Module } from "@nestjs/common";
import { QueueModule, createQueuePublisher } from "@signa/nest-queue";
import { TestController } from "./test.controller";
import { TestService } from "./test.service";
import { TestProcessor } from "./test.processor";

@Module({
  imports: [
    // Register the "test" queue for this module
    QueueModule.registerQueue("test")
  ],
  controllers: [TestController],
  providers: [
    TestService,
    TestProcessor,
    // Create QueuePublisher with the "test" queue injected
    createQueuePublisher(["test"])
  ]
})
export class TestModule {}
