import { Injectable } from "@nestjs/common";
import type { DrizzlePGConfig } from "@signa/nest-drizzle";
import type { AppDatabase, DrizzleConfigFactory } from "@signa/nest-drizzle";
import * as schema from "@signa/runtime-drizzle/schemas";
import { InjectConfig } from "@signa/nest-config";
import { DATABASE_CONFIG, type DatabaseConfig as DbConfig } from "@signa/api/core/config";

const dbSchema = { ...schema };

export type DrizzleDatabase = AppDatabase<typeof dbSchema>;

@Injectable()
export class DatabaseConfig implements DrizzleConfigFactory {
  constructor(
    @InjectConfig(DATABASE_CONFIG)
    private readonly dbConfig: DbConfig
  ) {}

  create(): DrizzlePGConfig {
    return {
      pg: {
        connection: "pool",
        config: {
          connectionString: this.dbConfig.url
        }
      },
      config: {
        schema: dbSchema
      }
    };
  }
}
