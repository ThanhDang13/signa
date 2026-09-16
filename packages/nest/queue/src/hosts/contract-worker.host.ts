import { WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import type { JobContract } from "@signa/dsl-queue-contract";
import { createJobHandlerNotFoundError, createJobValidationError } from "../errors";
import { ZodError } from "zod";

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
export abstract class ContractWorker extends WorkerHost {
  private handlers = new Map<string, JobHandler>();

  constructor() {
    super();
    this.discoverHandlers();
  }

  /**
   * Main process method called by BullMQ
   * Routes to the appropriate handler based on job name
   */
  async process(job: Job, token?: string): Promise<unknown> {
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

    const result = await handler.call(this, job);

    // Validate result with contract if available
    if (contract && contract.result) {
      try {
        return contract.result.parse(result);
      } catch (error) {
        if (error instanceof ZodError) {
          throw createJobValidationError(job.name, "result", error);
        }
        throw error;
      }
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
}
