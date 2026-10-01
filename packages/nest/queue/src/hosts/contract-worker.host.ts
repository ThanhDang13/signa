import { Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from "@nestjs/common";
import { WorkerHost } from "@nestjs/bullmq";
import type { Job, Queue } from "bullmq";
import type { JobContract } from "@signa/dsl-queue-contract";
import { createJobHandlerNotFoundError, createJobValidationError, isNonRetryableError } from "../errors";
import { ZodError } from "zod";
import type { JobResult } from "@signa/contracts-queue";

type JobHandler = (job: Job) => Promise<unknown>;

/**
 * Base class for contract-based job processors
 * Automatically routes jobs to handler methods based on job name
 *
 * @example
 * ```typescript
 * @Processor('scan')
 * export class ScanProcessor extends ContractWorker {
 *   @JobHandler(processBallotJob)
 *   async handleProcessBallot(
 *     job: Job<InferJobData<typeof processBallotJob>>
 *   ): Promise<InferJobResult<typeof processBallotJob>> {
 *     // Automatically routed based on job name
 *     // Data validated with contract schema
 *     const { s3Key, formConfigId } = job.data;
 *
 *     // Process the job
 *     return { ballotId: '...', marks: [...] };
 *   }
 * }
 * ```
 */
export abstract class ContractWorker extends WorkerHost implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly contractWorkerLogger = new Logger(ContractWorker.name);
  private handlers = new Map<string, JobHandler>();
  private resultQueues = new Map<string, Queue>();

  constructor() {
    super();
    this.discoverHandlers();
    this.contractWorkerLogger.log(
      `${this.constructor.name} discovered job handlers: ${Array.from(this.handlers.keys()).join(", ") || "none"}`
    );
  }

  async onApplicationBootstrap(): Promise<void> {
    const queueName = this.worker.name;

    this.worker.on("ready", () => {
      this.contractWorkerLogger.log(`${this.constructor.name} connected and listening on queue "${queueName}"`);
    });
    this.worker.on("active", (job) => {
      this.contractWorkerLogger.log(
        `${this.constructor.name} activated job ${job.name} (id: ${job.id}, attempt: ${job.attemptsMade + 1})`
      );
    });
    this.worker.on("completed", (job) => {
      this.contractWorkerLogger.log(
        `${this.constructor.name} completed job ${job.name} (id: ${job.id}, attempts: ${job.attemptsMade})`
      );
    });
    this.worker.on("failed", (job, error) => {
      this.contractWorkerLogger.error(
        `${this.constructor.name} failed job ${job?.name ?? "unknown"} (id: ${job?.id ?? "unknown"}, attempts: ${job?.attemptsMade ?? "unknown"}): ${error.message}`
      );
    });
    this.worker.on("stalled", (jobId) => {
      this.contractWorkerLogger.warn(`${this.constructor.name} detected stalled job ${jobId} on queue "${queueName}"`);
    });
    this.worker.on("error", (error) => {
      this.contractWorkerLogger.error(`${this.constructor.name} worker error on queue "${queueName}": ${error.message}`, error.stack);
    });

    await this.worker.waitUntilReady();
    this.contractWorkerLogger.log(`${this.constructor.name} worker is ready for queue "${queueName}"`);
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all(Array.from(this.resultQueues.values()).map((queue) => queue.close()));
    this.resultQueues.clear();
  }

  /**
   * Main process method called by BullMQ
   * Routes to the appropriate handler based on job name
   */
  async process(job: Job, token?: string): Promise<unknown> {
    this.contractWorkerLogger.log(`${this.constructor.name} received job ${job.name} (id: ${job.id}, attempt: ${job.attemptsMade + 1})`);

    const handler = this.handlers.get(job.name);

    if (!handler) {
      throw createJobHandlerNotFoundError(job.name, this.constructor.name);
    }

    // Validate job data with contract if available
    const contract = this.getContractForHandler(handler);
    if (contract) {
      try {
        job.data = contract.data.parse(job.data);
      } catch (error) {
        if (error instanceof ZodError) {
          throw createJobValidationError(job.name, "data", error);
        }
        throw error;
      }
    }

    let result: unknown;
    let error: Error | undefined;
    let isRetryable = true;

    try {
      result = await handler.call(this, job);

      // Validate result with contract if available
      if (contract && contract.result) {
        try {
          result = contract.result.parse(result);
        } catch (validationError) {
          if (validationError instanceof ZodError) {
            throw createJobValidationError(job.name, "result", validationError);
          }
          throw validationError;
        }
      }
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      isRetryable = !isNonRetryableError(err);

      // Emit failure result before throwing
      if (contract) {
        await this.emitResult(contract.queue, job, {
          status: "failed",
          error: {
            message: error.message,
            isRetryable
          }
        });
      }

      // Re-throw to let BullMQ handle retry logic
      throw error;
    }

    // Emit success result
    if (contract) {
      await this.emitResult(contract.queue, job, {
        status: "completed",
        data: result
      });
    }

    return result;
  }

  /**
   * Discover all methods decorated with @JobHandler
   */
  private discoverHandlers(): void {
    const prototype = Object.getPrototypeOf(this);
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== "constructor" && typeof prototype[name] === "function"
    );

    for (const methodName of methodNames) {
      const method = prototype[methodName] as JobHandler;
      const jobName = Reflect.getMetadata("queue:job-name", method);

      if (jobName) {
        this.handlers.set(jobName, method);
      }
    }
  }

  /**
   * Get the contract metadata for a handler
   */
  private getContractForHandler(handler: JobHandler): JobContract | null {
    return Reflect.getMetadata("queue:contract", handler) || null;
  }

  /**
   * Emit job result to the result queue
   * Uses jobId as dedup key, 5 attempts with exponential backoff
   */
  private async emitResult(
    queueName: string,
    job: Job,
    resultData: { status: "completed"; data: unknown } | { status: "failed"; error: { message: string; isRetryable: boolean } }
  ): Promise<void> {
    try {
      const resultQueue = await this.getOrCreateResultQueue(queueName);

      // Extract requestId from job.data if available, otherwise parse from jobId for backward compatibility
      let requestId: string;
      let attempt: number;

      if (job.data && typeof job.data === "object" && "requestId" in job.data && typeof job.data.requestId === "string") {
        // New format: requestId is in job.data
        requestId = job.data.requestId;
        attempt = job.attemptsMade + 1;
      } else {
        // Legacy format: parse jobId as ${requestId}-${attempt}
        const jobIdParts = job.id?.split("-") || [];
        attempt = jobIdParts.length > 0 ? parseInt(jobIdParts[jobIdParts.length - 1], 10) : 1;
        requestId = jobIdParts.slice(0, -1).join("-") || job.id || "unknown";
      }

      const jobResult: JobResult<unknown> = {
        jobId: job.id || "unknown",
        requestId,
        attempt: isNaN(attempt) ? 1 : attempt,
        status: resultData.status,
        ...(resultData.status === "completed" ? { data: resultData.data } : { error: resultData.error })
      };

      await resultQueue.add(
        "job-result",
        jobResult,
        {
          jobId: job.id, // Use same jobId for deduplication
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 2000
          },
          removeOnComplete: {
            age: 24 * 60 * 60 // 24 hours
          },
          removeOnFail: false
        }
      );
    } catch (error) {
      // Log but don't throw - result emission failures shouldn't fail the job
      const message = error instanceof Error ? error.message : String(error);
      this.contractWorkerLogger.error(`Failed to emit result for job ${job.id}: ${message}`);
    }
  }

  /**
   * Get or create a result queue for the given queue name
   */
  private async getOrCreateResultQueue(queueName: string): Promise<Queue> {
    let queue = this.resultQueues.get(queueName);

    if (!queue) {
      const { Queue } = await import("bullmq");
      const resultQueueName = `${queueName}.results`;

      // Get connection from the worker (this.worker is available from WorkerHost)
      const connection = (this as any).worker?.opts?.connection;

      if (!connection) {
        throw new Error(`Cannot create result queue: no connection available for queue ${queueName}`);
      }

      queue = new Queue(resultQueueName, { connection });
      this.resultQueues.set(queueName, queue);
    }

    return queue;
  }
}
