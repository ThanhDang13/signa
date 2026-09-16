import { Processor } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { ContractWorker, JobHandler, InferJobData, InferJobResult } from "@signa/nest-queue";
import type { Job } from "bullmq";
import { testJob } from "./test.contract";

@Injectable()
@Processor("test")
export class TestProcessor extends ContractWorker {
  private readonly logger = new Logger(TestProcessor.name);

  @JobHandler(testJob)
  async handleTestJob(
    job: Job<InferJobData<typeof testJob>>
  ): Promise<InferJobResult<typeof testJob>> {
    this.logger.log(`Processing test job: ${job.id}`);
    this.logger.log(`Message: ${job.data.message}`);

    // Simulate processing with optional delay
    if (job.data.delay) {
      await new Promise((resolve) => setTimeout(resolve, job.data.delay));
    }

    this.logger.log(`Completed test job: ${job.id}`);

    return {
      processed: true,
      timestamp: new Date().toISOString(),
      originalMessage: job.data.message
    };
  }
}
