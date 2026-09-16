import { Body, Controller, HttpCode, HttpStatus, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CommandBus } from "@nestjs/cqrs";
import { ContractRoute, Response } from "@signa/nest-contract";
import {
  createElectionContract,
  updateElectionContract,
  activateElectionContract,
  closeElectionContract,
  deleteElectionContract
} from "@signa/contracts-http/election";
import {
  CreateElectionCommand,
  UpdateElectionCommand,
  DeleteElectionCommand,
  ActivateElectionCommand,
  CloseElectionCommand
} from "@signa/api/modules/election/application/commands";
import {
  CreateElectionInputDto,
  CreateElectionOutputDto
} from "@signa/api/modules/election/presentation/dto/create-election.dto";
import {
  UpdateElectionParamsDto,
  UpdateElectionInputDto,
  UpdateElectionOutputDto
} from "@signa/api/modules/election/presentation/dto/update-election.dto";
import {
  ActivateElectionParamsDto,
  ActivateElectionOutputDto
} from "@signa/api/modules/election/presentation/dto/activate-election.dto";
import {
  CloseElectionParamsDto,
  CloseElectionOutputDto
} from "@signa/api/modules/election/presentation/dto/close-election.dto";
import {
  DeleteElectionParamsDto,
  DeleteElectionOutputDto
} from "@signa/api/modules/election/presentation/dto/delete-election.dto";
import { Protected } from "@signa/api/core/security/decorator";
import { CurrentUser, type JwtPayload } from "@signa/nest-jwt";

const CreateElectionRoute = ContractRoute(createElectionContract, {
  summary: "Create a new election"
});

const UpdateElectionRoute = ContractRoute(updateElectionContract, {
  summary: "Update an election"
});

const ActivateElectionRoute = ContractRoute(activateElectionContract, {
  summary: "Activate an election"
});

const CloseElectionRoute = ContractRoute(closeElectionContract, {
  summary: "Close an election"
});

const DeleteElectionRoute = ContractRoute(deleteElectionContract, {
  summary: "Delete an election"
});

@ApiTags("ELECTIONS")
@Controller()
export class ElectionController {
  constructor(private readonly commandBus: CommandBus) {}

  @CreateElectionRoute
  @Protected()
  @Response({ type: CreateElectionOutputDto })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateElectionInputDto, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(
      new CreateElectionCommand({
        title: dto.title,
        description: dto.description,
        formStructure: dto.formStructure,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        maxVoters: dto.maxVoters,
        createdById: user.id
      })
    );
  }

  @UpdateElectionRoute
  @Protected()
  @Response({ type: UpdateElectionOutputDto })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param() params: UpdateElectionParamsDto,
    @Body() dto: UpdateElectionInputDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.commandBus.execute(
      new UpdateElectionCommand({
        id: params.id,
        title: dto.title,
        description: dto.description,
        formStructure: dto.formStructure,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        maxVoters: dto.maxVoters
      })
    );
  }

  @ActivateElectionRoute
  @Protected()
  @Response({ type: ActivateElectionOutputDto })
  @HttpCode(HttpStatus.OK)
  async activate(@Param() params: ActivateElectionParamsDto, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(new ActivateElectionCommand({ id: params.id }));
  }

  @CloseElectionRoute
  @Protected()
  @Response({ type: CloseElectionOutputDto })
  @HttpCode(HttpStatus.OK)
  async close(@Param() params: CloseElectionParamsDto, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(new CloseElectionCommand({ id: params.id }));
  }

  @DeleteElectionRoute
  @Protected()
  @Response({ type: DeleteElectionOutputDto })
  @HttpCode(HttpStatus.OK)
  async delete(@Param() params: DeleteElectionParamsDto, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(new DeleteElectionCommand({ id: params.id }));
  }
}
