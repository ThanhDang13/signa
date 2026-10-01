import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { NEST_QUEUE_OPTIONS, type NestQueueOptions } from "@signa/nest-queue";

const REDIS_READY_TIMEOUT_MS = 10_000;

@Injectable()
export class QueueReadinessService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueReadinessService.name);
  private readonly queue: Queue;

  constructor(
    @Inject(NEST_QUEUE_OPTIONS)
    private readonly options: NestQueueOptions
  ) {
    this.queue = new Queue("__signa_worker_readiness__", {
      connection: options.connection
    });
  }

  async onModuleInit(): Promise<void> {
    const { host, port, db } = this.options.connection;

    try {
      const client = await this.withTimeout(
        this.queue.client,
        `Timed out connecting to Redis at ${host}:${port} (db ${db ?? 0}) after ${REDIS_READY_TIMEOUT_MS}ms`
      );
      await this.withTimeout(
        client.runCommand("ping", []),
        `Timed out pinging Redis at ${host}:${port} (db ${db ?? 0}) after ${REDIS_READY_TIMEOUT_MS}ms`
      );
      this.logger.log(`Redis readiness check passed at ${host}:${port} (db ${db ?? 0})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Redis readiness check failed at ${host}:${port} (db ${db ?? 0}): ${message}`);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMessage: string): Promise<T> {
    let timeout: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error(timeoutMessage)), REDIS_READY_TIMEOUT_MS);
        })
      ]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
