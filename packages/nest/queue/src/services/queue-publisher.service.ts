import { Injectable, type Provider, OnModuleDestroy } from "@nestjs/common";
import { Queue, QueueEvents } from "bullmq";
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

export interface PublishResult<T> {
  jobId: string;
  onCompleted(callback: (result: T) => void | Promise<void>): PublishResult<T>;
  onFailed(callback: (error: Error) => void | Promise<void>): PublishResult<T>;
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
 *   // Fire-and-forget
 *   async scanBallot(s3Key: string) {
 *     const { jobId } = await this.queuePublisher.publish(processBallotJob, { s3Key });
 *     return { jobId };
 *   }
 *
 *   // With callbacks
 *   async scanBallotWithCallbacks(s3Key: string) {
 *     await this.queuePublisher
 *       .publish(processBallotJob, { s3Key })
 *       .onCompleted((result) => {
 *         console.log('Ballot processed:', result);
 *       })
 *       .onFailed((error) => {
 *         console.error('Processing failed:', error);
 *       });
 *   }
 *
 *   // Wait for result
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
  private queueEvents = new Map<string, QueueEvents>();

  /**
   * Publish a job to a queue (fire-and-forget with optional callbacks)
   */
  async publish<T extends JobContract>(
    contract: T,
    data: InferJobData<T>,
    options?: {
      delay?: number;
      attempts?: number;
      priority?: number;
    }
  ): Promise<PublishResult<InferJobResult<T>>> {
    const queue = this.getQueue(contract.queue);

    try {
      // Validate data with contract schema
      const validatedData = contract.data.parse(data);

      const job = await queue.add(contract.job, validatedData, options);
      const jobId = job.id!;

      const result: PublishResult<InferJobResult<T>> = {
        jobId,
        onCompleted: (callback) => {
          this.setupCompletedListener(contract.queue, queue, jobId, contract.result, callback);
          return result;
        },
        onFailed: (callback) => {
          this.setupFailedListener(contract.queue, queue, jobId, callback);
          return result;
        }
      };

      return result;
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
    const queueEvents = this.getQueueEvents(contract.queue, queue);
    const timeout = options?.timeout ?? 30000;

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
   * Clean up QueueEvents on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    const closePromises = Array.from(this.queueEvents.values()).map((qe) => qe.close());
    await Promise.all(closePromises);
    this.queueEvents.clear();
  }

  private getQueue(name: string): Queue {
    const queue = this.queues.get(name);
    if (!queue) {
      throw createQueueNotFoundError(name);
    }
    return queue;
  }

  private getQueueEvents(name: string, queue: Queue): QueueEvents {
    let queueEvents = this.queueEvents.get(name);

    if (!queueEvents) {
      queueEvents = new QueueEvents(name, {
        connection: queue.opts.connection
      });
      this.queueEvents.set(name, queueEvents);
    }

    return queueEvents;
  }

  private setupCompletedListener<T>(
    queueName: string,
    queue: Queue,
    jobId: string,
    resultSchema: any,
    callback: (result: T) => void | Promise<void>
  ): void {
    const queueEvents = this.getQueueEvents(queueName, queue);

    const listener = async ({ jobId: completedJobId, returnvalue }: any) => {
      if (completedJobId === jobId) {
        try {
          const validatedResult = resultSchema ? resultSchema.parse(returnvalue) : returnvalue;
          await callback(validatedResult as T);
        } catch (error) {
          // Log validation errors but don't throw
          console.error(`Result validation failed for job ${jobId}:`, error);
        } finally {
          queueEvents.off("completed", listener);
        }
      }
    };

    queueEvents.on("completed", listener);
  }

  private setupFailedListener(
    queueName: string,
    queue: Queue,
    jobId: string,
    callback: (error: Error) => void | Promise<void>
  ): void {
    const queueEvents = this.getQueueEvents(queueName, queue);

    const listener = async ({ jobId: failedJobId, failedReason }: any) => {
      if (failedJobId === jobId) {
        try {
          const error = new Error(failedReason || "Job failed");
          await callback(error);
        } catch (error) {
          console.error(`Failed callback error for job ${jobId}:`, error);
        } finally {
          queueEvents.off("failed", listener);
        }
      }
    };

    queueEvents.on("failed", listener);
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
