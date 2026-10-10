import { Body, Controller, HttpCode, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ContractRoute, Response } from "@signa/nest-contract";
import {
  createElectionContract,
  updateElectionContract,
  activateElectionContract,
  closeElectionContract,
  deleteElectionContract,
  getElectionContract,
  listElectionsContract,
  getElectionResultsContract,
  getDashboardStatsContract
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
import {
  GetElectionParamsDto,
  GetElectionOutputDto
} from "@signa/api/modules/election/presentation/dto/get-election.dto";
import {
  GetElectionResultsParamsDto,
  GetElectionResultsOutputDto
} from "@signa/api/modules/election/presentation/dto/get-election-results.dto";
import {
  ListElectionsQueryDto,
  ListElectionsOutputDto
} from "@signa/api/modules/election/presentation/dto/list-elections.dto";
import {
  GetDashboardStatsOutputDto
} from "@signa/api/modules/election/presentation/dto/get-dashboard-stats.dto";
import { Protected } from "@signa/api/core/security/decorator";
import { CurrentUser, type JwtPayload } from "@signa/nest-jwt";
import {
  GetElectionByIdQuery,
  GetElectionResultsQuery,
  ListElectionsQuery,
  GetDashboardStatsQuery
} from "@signa/api/modules/election/application/queries";

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

const GetElectionRoute = ContractRoute(getElectionContract, {
  summary: "Get an election by ID"
});

const ListElectionsRoute = ContractRoute(listElectionsContract, {
  summary: "List elections with pagination and filters"
});

const GetElectionResultsRoute = ContractRoute(getElectionResultsContract, {
  summary: "Get election results and statistics"
});

const GetDashboardStatsRoute = ContractRoute(getDashboardStatsContract, {
  summary: "Get dashboard statistics"
});

@ApiTags("ELECTIONS")
@Controller()
export class ElectionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

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

  @GetElectionRoute
  @Protected()
  @Response({ type: GetElectionOutputDto })
  @HttpCode(HttpStatus.OK)
  async getById(@Param() params: GetElectionParamsDto, @CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new GetElectionByIdQuery({ id: params.id }));
  }

  @ListElectionsRoute
  @Protected()
  @Response({ type: ListElectionsOutputDto })
  @HttpCode(HttpStatus.OK)
  async list(@Query() query: ListElectionsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(
      new ListElectionsQuery({
        pageIndex: query.pageIndex,
        pageSize: query.pageSize,
        sortBy: query.sortBy,
        order: query.order,
        status: query.status,
        createdById: query.createdById
      })
    );
  }

  @GetElectionResultsRoute
  @Protected()
  @Response({ type: GetElectionResultsOutputDto })
  @HttpCode(HttpStatus.OK)
  async getResults(@Param() params: GetElectionResultsParamsDto, @CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new GetElectionResultsQuery({ id: params.id }));
  }

  @GetDashboardStatsRoute
  @Protected()
  @Response({ type: GetDashboardStatsOutputDto })
  @HttpCode(HttpStatus.OK)
  async getDashboardStats(@CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new GetDashboardStatsQuery({}));
  }
}
