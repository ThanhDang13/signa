import { Body, Controller, HttpCode, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ContractRoute, Response } from "@signa/nest-contract";
import {
  createClerkContract,
  listClerksContract,
  getClerkContract,
  updateClerkContract,
  deleteClerkContract,
  resetClerkPasswordContract
} from "@signa/contracts-http/identity";
import {
  CreateClerkCommand,
  UpdateClerkCommand,
  DeleteClerkCommand,
  ResetClerkPasswordCommand
} from "@signa/api/modules/identity/application/commands";
import {
  ListClerksQuery,
  GetClerkQuery
} from "@signa/api/modules/identity/application/queries";
import {
  CreateClerkInputDto,
  CreateClerkOutputDto
} from "@signa/api/modules/identity/presentation/dto/create-clerk.dto";
import {
  ListClerksQueryDto,
  ListClerksOutputDto
} from "@signa/api/modules/identity/presentation/dto/list-clerks.dto";
import {
  GetClerkParamsDto,
  GetClerkOutputDto
} from "@signa/api/modules/identity/presentation/dto/get-clerk.dto";
import {
  UpdateClerkParamsDto,
  UpdateClerkInputDto,
  UpdateClerkOutputDto
} from "@signa/api/modules/identity/presentation/dto/update-clerk.dto";
import {
  DeleteClerkParamsDto,
  DeleteClerkOutputDto
} from "@signa/api/modules/identity/presentation/dto/delete-clerk.dto";
import {
  ResetClerkPasswordParamsDto,
  ResetClerkPasswordInputDto,
  ResetClerkPasswordOutputDto
} from "@signa/api/modules/identity/presentation/dto/reset-clerk-password.dto";
import { Protected } from "@signa/api/core/security/decorator";

const CreateClerkRoute = ContractRoute(createClerkContract, {
  summary: "Create a new clerk"
});

const ListClerksRoute = ContractRoute(listClerksContract, {
  summary: "List all clerks"
});

const GetClerkRoute = ContractRoute(getClerkContract, {
  summary: "Get clerk details"
});

const UpdateClerkRoute = ContractRoute(updateClerkContract, {
  summary: "Update clerk"
});

const DeleteClerkRoute = ContractRoute(deleteClerkContract, {
  summary: "Delete clerk"
});

const ResetClerkPasswordRoute = ContractRoute(resetClerkPasswordContract, {
  summary: "Reset clerk password"
});

@ApiTags("CLERKS")
@Controller()
export class ClerkController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @CreateClerkRoute
  @Protected()
  @Response({ type: CreateClerkOutputDto })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateClerkInputDto) {
    return this.commandBus.execute(
      new CreateClerkCommand({
        email: dto.email,
        fullname: dto.fullname,
        password: dto.password
      })
    );
  }

  @ListClerksRoute
  @Protected()
  @Response({ type: ListClerksOutputDto })
  @HttpCode(HttpStatus.OK)
  async list(@Query() query: ListClerksQueryDto) {
    return this.queryBus.execute(
      new ListClerksQuery({
        pageIndex: query.pageIndex,
        pageSize: query.pageSize,
        sortBy: query.sortBy,
        order: query.order
      })
    );
  }

  @GetClerkRoute
  @Protected()
  @Response({ type: GetClerkOutputDto })
  @HttpCode(HttpStatus.OK)
  async getOne(@Param() params: GetClerkParamsDto) {
    return this.queryBus.execute(
      new GetClerkQuery({
        id: params.id
      })
    );
  }

  @UpdateClerkRoute
  @Protected()
  @Response({ type: UpdateClerkOutputDto })
  @HttpCode(HttpStatus.OK)
  async update(@Param() params: UpdateClerkParamsDto, @Body() dto: UpdateClerkInputDto) {
    return this.commandBus.execute(
      new UpdateClerkCommand({
        id: params.id,
        email: dto.email,
        fullname: dto.fullname
      })
    );
  }

  @DeleteClerkRoute
  @Protected()
  @Response({ type: DeleteClerkOutputDto })
  @HttpCode(HttpStatus.OK)
  async delete(@Param() params: DeleteClerkParamsDto) {
    return this.commandBus.execute(
      new DeleteClerkCommand({
        id: params.id
      })
    );
  }

  @ResetClerkPasswordRoute
  @Protected()
  @Response({ type: ResetClerkPasswordOutputDto })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param() params: ResetClerkPasswordParamsDto,
    @Body() dto: ResetClerkPasswordInputDto
  ) {
    return this.commandBus.execute(
      new ResetClerkPasswordCommand({
        id: params.id,
        password: dto.password
      })
    );
  }
}
