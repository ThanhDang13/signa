import { Global, Module } from "@nestjs/common";
import { DrizzleModule as NestDrizzleModule } from "@signa/nest-drizzle";
import { DatabaseConfig } from "@signa/api/core/database/database.config";

@Global()
@Module({
  imports: [
    NestDrizzleModule.registerAsync({
      useClass: DatabaseConfig
    })
  ],
  exports: [NestDrizzleModule]
})
export class DatabaseModule {}
