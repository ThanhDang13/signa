import type { OnModuleDestroy } from "@nestjs/common";
import { Injectable, type Provider } from "@nestjs/common";
import type { Queue } from "bullmq";
import { QueueEvents } from "bullmq";
import { getQueueToken } from "@nestjs/bullmq";
import type { JobContract, InferJobData, InferJobResult } from "@signa/dsl-queue-contract";
import {
  createQueueNotFoundError,
  createJobValidationError,
  createJobPublishError
} from "../errors";
import { ZodError } from "zod";

export interface JobInfo<T = unknown> {
  id: string;
  state: string;
  data: T;
  result?: unknown;
  progress?: unknown;
  timestamp: number;
  finishedOn?: number;
  failedReason?: string;
  stacktrace?: string[] | null;
}

/**
 * Queue publisher service for adding jobs to queues using contracts
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class BallotService {
 *   constructor(
 *     private readonly queuePublisher: QueuePublisher
 *   ) {}
 *
 *   // Fire-and-forget with explicit jobId
 *   async scanBallot(requestId: string, attempt: number, s3Key: string) {
 *     const jobId = `${requestId}-${attempt}`;
 *     await this.queuePublisher.publish(processBallotJob, { s3Key }, { jobId });
 *     return { jobId };
 *   }
 *
 *   // Wait for result (synchronous)
 *   async scanBallotSync(s3Key: string) {
 *     const result = await this.queuePublisher.publishAndWait(processBallotJob, { s3Key });
 *     return result;
 *   }
 * }
 * ```
 */
@Injectable()
export class QueuePublisher implements OnModuleDestroy {
  private queues = new Map<string, Queue>();

  /**
   * Publish a job to a queue (fire-and-forget)
   *
   * @param contract - Job contract defining the queue and data schema
   * @param data - Job data
   * @param options - Job options (jobId is required for deduplication)
   * @returns Job ID
   */
  async publish<T extends JobContract>(
    contract: T,
    data: InferJobData<T>,
    options: {
      jobId: string;
      delay?: number;
      attempts?: number;
      priority?: number;
    }
  ): Promise<{ jobId: string }> {
    const queue = this.getQueue(contract.queue);

    try {
      // Validate data with contract schema
      const validatedData = contract.data.parse(data);

      const job = await queue.add(contract.job, validatedData, {
        jobId: options.jobId,
        delay: options.delay,
        attempts: options.attempts ?? 1, // Default to 1 attempt (retry controlled by outbox)
        priority: options.priority
      });

      return { jobId: job.id! };
    } catch (error) {
      if (error instanceof ZodError) {
        throw createJobValidationError(contract.job, "data", error);
      }
      throw createJobPublishError(contract.job, contract.queue, error as Error);
    }
  }

  /**
   * Publish a job and wait for the result
   * Use this for CPU-intensive tasks where you need the result (e.g., OMR processing)
   */
  async publishAndWait<T extends JobContract>(
    contract: T,
    data: InferJobData<T>,
    options?: {
      delay?: number;
      attempts?: number;
      priority?: number;
      timeout?: number; // Default 30000ms
    }
  ): Promise<InferJobResult<T>> {
    const queue = this.getQueue(contract.queue);
    const timeout = options?.timeout ?? 30000;

    // Create QueueEvents for this operation
    const queueEvents = new QueueEvents(contract.queue, {
      connection: queue.opts.connection
    });

    try {
      // Validate data with contract schema
      const validatedData = contract.data.parse(data);

      // Add job to queue
      const job = await queue.add(contract.job, validatedData, {
        delay: options?.delay,
        attempts: options?.attempts,
        priority: options?.priority
      });

      // Wait for job to complete
      const result = await job.waitUntilFinished(queueEvents, timeout);

      // Validate result with contract schema if provided
      if (contract.result) {
        return contract.result.parse(result) as InferJobResult<T>;
      }

      return result as InferJobResult<T>;
    } catch (error) {
      if (error instanceof ZodError) {
        throw createJobValidationError(contract.job, "data", error);
      }
      throw createJobPublishError(contract.job, contract.queue, error as Error);
    } finally {
      await queueEvents.close();
    }
  }

  /**
   * Get job status and result by ID
   */
  async getJob(queueName: string, jobId: string): Promise<JobInfo | null> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();

    return {
      id: job.id!,
      state,
      data: job.data,
      result: job.returnvalue,
      progress: job.progress,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace
    };
  }

  /**
   * Register a queue instance
   */
  registerQueue(name: string, queue: Queue): void {
    this.queues.set(name, queue);
  }

  /**
   * Clean up on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    // No QueueEvents to clean up anymore
  }

  private getQueue(name: string): Queue {
    const queue = this.queues.get(name);
    if (!queue) {
      throw createQueueNotFoundError(name);
    }
    return queue;
  }
}

/**
 * Factory to create QueuePublisher with injected queues
 */
export function createQueuePublisher(queueNames: string[]): Provider {
  return {
    provide: QueuePublisher,
    useFactory: (...queues: Queue[]) => {
      const publisher = new QueuePublisher();
      queueNames.forEach((name, index) => {
        publisher.registerQueue(name, queues[index]);
      });
      return publisher;
    },
    inject: queueNames.map((name) => getQueueToken(name))
  };
}
