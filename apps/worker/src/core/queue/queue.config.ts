import { Injectable } from "@nestjs/common";
import { InjectConfig } from "@signa/nest-config";
import { NestQueueOptionsFactory, NestQueueOptions } from "@signa/nest-queue";
import { QUEUE_CONFIG, type QueueConfig } from "@signa/worker/core/config/tokens";

@Injectable()
export class QueueConfigService implements NestQueueOptionsFactory {
  constructor(
    @InjectConfig(QUEUE_CONFIG)
    private readonly config: QueueConfig
  ) {}

  create(): NestQueueOptions {
    return {
      connection: {
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db
      }
    };
  }
}
