import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, ModuleRef } from "@nestjs/core";
import { Worker, Queue } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { ON_JOB_RESULT_METADATA } from "../decorators/on-job-result.decorator";
import type { JobContract, InferJobResult } from "@signa/dsl-queue-contract";
import { jobResultSchema, type JobResult } from "@signa/contracts-queue";
import { ZodError } from "zod";

type ResultHandler = {
  instance: any;
  methodName: string;
  contract: JobContract;
};

/**
 * Service that discovers @OnJobResult handlers and creates workers
 * to consume job results from <queue>.results queues
 */
@Injectable()
export class JobResultConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobResultConsumer.name);
  private readonly workers = new Map<string, Worker>();
  private readonly handlers = new Map<string, ResultHandler[]>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly moduleRef: ModuleRef
  ) {}

  async onModuleInit(): Promise<void> {
    await this.discoverHandlers();
    await this.createWorkers();
  }

  async onModuleDestroy(): Promise<void> {
    const closePromises = Array.from(this.workers.values()).map((worker) => worker.close());
    await Promise.all(closePromises);
    this.workers.clear();
  }

  /**
   * Discover all methods decorated with @OnJobResult
   */
  private async discoverHandlers(): Promise<void> {
    const providers = this.discoveryService.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || !Object.getPrototypeOf(instance)) {
        continue;
      }

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const contract: JobContract | undefined = Reflect.getMetadata(
          ON_JOB_RESULT_METADATA,
          instance.constructor,
          methodName
        );

        if (contract) {
          const queueName = contract.queue;

          if (!this.handlers.has(queueName)) {
            this.handlers.set(queueName, []);
          }

          this.handlers.get(queueName)!.push({
            instance,
            methodName,
            contract
          });

          this.logger.log(
            `Discovered @OnJobResult handler: ${instance.constructor.name}.${methodName} for queue "${queueName}"`
          );
        }
      }
    }

    // Validate: each queue should have exactly one handler
    for (const [queueName, handlers] of this.handlers.entries()) {
      if (handlers.length > 1) {
        throw new Error(
          `Multiple @OnJobResult handlers found for queue "${queueName}": ${handlers
            .map((h) => `${h.instance.constructor.name}.${h.methodName}`)
            .join(", ")}. Only one handler per queue is allowed.`
        );
      }
    }
  }

  /**
   * Create BullMQ workers for each result queue
   */
  private async createWorkers(): Promise<void> {
    for (const [queueName, handlers] of this.handlers.entries()) {
      const handler = handlers[0]; // Validated to have exactly one
      const resultQueueName = `${queueName}.results`;

      // Get the queue connection config from the main queue
      let connection: any;
      try {
        const mainQueue = this.moduleRef.get<Queue>(
          `BullQueue_${queueName}`,
          { strict: false }
        );
        connection = mainQueue.opts.connection;
      } catch (error) {
        this.logger.error(
          `Failed to get connection config for queue "${queueName}". Result consumer not started.`,
          error
        );
        continue;
      }

      const worker = new Worker(
        resultQueueName,
        async (job) => {
          return this.processResult(handler, job.data);
        },
        {
          connection,
          concurrency: 5,
          limiter: {
            max: 10,
            duration: 1000
          }
        }
      );

      worker.on("completed", (job) => {
        this.logger.log(`Result processed: ${job.id} from queue ${resultQueueName}`);
      });

      worker.on("failed", (job, error) => {
        this.logger.error(
          `Result processing failed: ${job?.id} from queue ${resultQueueName}`,
          error
        );
      });

      this.workers.set(resultQueueName, worker);
      this.logger.log(`Started result consumer for queue: ${resultQueueName}`);
    }
  }

  /**
   * Process a single job result
   */
  private async processResult(handler: ResultHandler, data: unknown): Promise<void> {
    const { instance, methodName, contract } = handler;

    // Parse and validate result envelope
    const resultEnvelopeSchema = jobResultSchema(contract.result);
    let result: JobResult<InferJobResult<typeof contract>>;

    try {
      result = resultEnvelopeSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(
          `Job result validation failed for ${contract.queue}.${contract.job}: ${error.message}`
        );
      }
      throw error;
    }

    // Call the handler
    // Return = ack, throw = retry (only for transient errors)
    await instance[methodName](result);
  }
}
