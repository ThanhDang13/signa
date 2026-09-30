import { Module } from "@nestjs/common";
import { ElectionController } from "@signa/api/modules/election/presentation/controllers/election.controller";
import { DrizzleElectionRepository } from "@signa/api/modules/election/infrastructure/persistence/drizzle-election.repository";
import { ELECTION_REPOSITORY } from "@signa/api/modules/election/application/ports";
import * as CommandHandlers from "@signa/api/modules/election/application/commands/handlers";
import * as QueryHandlers from "@signa/api/modules/election/application/queries/handlers";

const commandHandlers = Object.values(CommandHandlers);
const queryHandlers = Object.values(QueryHandlers);

@Module({
  controllers: [ElectionController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    { provide: ELECTION_REPOSITORY, useClass: DrizzleElectionRepository }
  ],
  exports: [ELECTION_REPOSITORY]
})
export class ElectionModule {}
