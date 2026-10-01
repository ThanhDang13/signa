import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { QueueModule } from "@signa/nest-queue";
import { BallotController } from "@signa/api/modules/ballot/presentation/controllers/ballot.controller";
import { DrizzleBallotRepository } from "@signa/api/modules/ballot/infrastructure/persistence/drizzle-ballot.repository";
import { DrizzleBallotGenerationOutboxRepository } from "@signa/api/modules/ballot/infrastructure/persistence/drizzle-ballot-generation-outbox.repository";
import { DrizzleOmrProcessingOutboxRepository } from "@signa/api/modules/ballot/infrastructure/persistence/drizzle-omr-processing-outbox.repository";
import { DrizzleBallotScanResultRepository } from "@signa/api/modules/ballot/infrastructure/persistence/drizzle-ballot-scan-result.repository";
import { BallotGenerationOutboxScheduler } from "@signa/api/modules/ballot/application/schedulers/outbox.scheduler";
import { OmrProcessingOutboxScheduler } from "@signa/api/modules/ballot/application/schedulers/omr-processing-outbox.scheduler";
import { BallotResultValidator } from "@signa/api/modules/ballot/application/services/ballot-result-validator";
import { OmrScanResultHandler } from "@signa/api/modules/ballot/application/handlers/omr-scan-result.handler";
import {
  BALLOT_REPOSITORY,
  BALLOT_GENERATION_OUTBOX_REPOSITORY,
  OMR_PROCESSING_OUTBOX_REPOSITORY,
  BALLOT_SCAN_RESULT_REPOSITORY
} from "@signa/api/modules/ballot/application/ports";
import * as CommandHandlers from "@signa/api/modules/ballot/application/commands/handlers";
import * as QueryHandlers from "@signa/api/modules/ballot/application/queries/handlers";
import { ElectionModule } from "@signa/api/modules/election/election.module";
import { createQueuePublisher } from "@signa/nest-queue";

const commandHandlers = Object.values(CommandHandlers);
const queryHandlers = Object.values(QueryHandlers);

@Module({
  imports: [
    ScheduleModule.forRoot(),
    QueueModule.registerQueue("ballot-generation"),
    QueueModule.registerQueue("scan"),
    ElectionModule
  ],
  controllers: [BallotController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    { provide: BALLOT_REPOSITORY, useClass: DrizzleBallotRepository },
    {
      provide: BALLOT_GENERATION_OUTBOX_REPOSITORY,
      useClass: DrizzleBallotGenerationOutboxRepository
    },
    {
      provide: OMR_PROCESSING_OUTBOX_REPOSITORY,
      useClass: DrizzleOmrProcessingOutboxRepository
    },
    {
      provide: BALLOT_SCAN_RESULT_REPOSITORY,
      useClass: DrizzleBallotScanResultRepository
    },
    createQueuePublisher(["ballot-generation", "scan"]),
    BallotGenerationOutboxScheduler,
    OmrProcessingOutboxScheduler,
    BallotResultValidator,
    OmrScanResultHandler
  ],
  exports: [BALLOT_REPOSITORY]
})
export class BallotModule {}

