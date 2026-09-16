import { Module } from "@nestjs/common";
import { ElectionController } from "@signa/api/modules/election/presentation/controllers/election.controller";
import { DrizzleElectionRepository } from "@signa/api/modules/election/infrastructure/persistence/drizzle-election.repository";
import { ELECTION_REPOSITORY } from "@signa/api/modules/election/application/ports";
import * as CommandHandlers from "@signa/api/modules/election/application/commands/handlers";

const commandHandlers = Object.values(CommandHandlers);

@Module({
  controllers: [ElectionController],
  providers: [
    ...commandHandlers,
    { provide: ELECTION_REPOSITORY, useClass: DrizzleElectionRepository }
  ],
  exports: [ELECTION_REPOSITORY]
})
export class ElectionModule {}
