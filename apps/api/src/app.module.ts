import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ConfigModule } from "@signa/api/core/config";
import { DatabaseModule } from "@signa/api/core/database/database.module";
import { ErrorModule } from "@signa/api/core/error/error.module";
import { SecurityModule } from "@signa/api/core/security/security.module";
import { QueueModule } from "@signa/api/core/queue";
import { CacheModule } from "@signa/api/core/cache";
import { S3Module } from "@signa/api/core/s3/s3.module";
import { IdentityModule } from "@signa/api/modules/identity/identity.module";
import { TestModule } from "@signa/api/modules/test/test.module";
import { ContractModule } from "@signa/nest-contract";
import { ElectionModule } from "@signa/api/modules/election/election.module";
import { BallotModule } from "@signa/api/modules/ballot/ballot.module";

@Module({
  imports: [
    CqrsModule.forRoot(),
    ContractModule,
    ConfigModule,
    ErrorModule,
    SecurityModule,
    DatabaseModule,
    QueueModule,
    CacheModule,
    S3Module,
    IdentityModule,
    ElectionModule,
    BallotModule,
    TestModule
  ],
  providers: [],
  controllers: []
})
export class AppModule {}
