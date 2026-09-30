import { Body, Controller, HttpCode, HttpStatus, Post, Param, Query, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ContractRoute, Response } from "@signa/nest-contract";
import {
  generateBallotsContract,
  getUploadUrlContract,
  processBallotScanContract,
  previewBallotContract,
  getBallotContract,
  listBallotsContract,
  listScanRequestsContract,
  getScanRequestContract,
  retryScanContract,
  pollScanStatusContract
} from "@signa/contracts-http/ballot";
import {
  GenerateBallotsCommand,
  GetUploadUrlCommand,
  ProcessBallotScanCommand,
  PreviewBallotCommand,
  RetryBallotScanCommand
} from "@signa/api/modules/ballot/application/commands";
import {
  GenerateBallotsInputDto,
  GenerateBallotsOutputDto
} from "@signa/api/modules/ballot/presentation/dto/generate-ballots.dto";
import {
  GetUploadUrlParamsDto,
  GetUploadUrlInputDto,
  GetUploadUrlOutputDto
} from "@signa/api/modules/ballot/presentation/dto/get-upload-url.dto";
import {
  ProcessBallotScanParamsDto,
  ProcessBallotScanInputDto,
  ProcessBallotScanOutputDto
} from "@signa/api/modules/ballot/presentation/dto/process-ballot-scan.dto";
import {
  PreviewBallotInputDto,
  PreviewBallotOutputDto
} from "@signa/api/modules/ballot/presentation/dto/preview-ballot.dto";
import {
  GetBallotParamsDto,
  GetBallotOutputDto
} from "@signa/api/modules/ballot/presentation/dto/get-ballot.dto";
import {
  ListBallotsQueryDto,
  ListBallotsOutputDto
} from "@signa/api/modules/ballot/presentation/dto/list-ballots.dto";
import {
  ListScanRequestsQueryDto,
  ListScanRequestsOutputDto
} from "@signa/api/modules/ballot/presentation/dto/list-scan-requests.dto";
import {
  GetScanRequestParamsDto,
  GetScanRequestOutputDto
} from "@signa/api/modules/ballot/presentation/dto/get-scan-request.dto";
import {
  PollScanStatusQueryDto,
  PollScanStatusOutputDto
} from "@signa/api/modules/ballot/presentation/dto/poll-scan-status.dto";
import {
  RetryScanParamsDto,
  RetryScanInputDto,
  RetryScanOutputDto
} from "@signa/api/modules/ballot/presentation/dto/retry-scan.dto";
import { Protected } from "@signa/api/core/security/decorator";
import { CurrentUser, type JwtPayload } from "@signa/nest-jwt";
import {
  GetBallotByIdQuery,
  ListBallotsQuery,
  GetScanRequestQuery,
  ListScanRequestsQuery,
  PollScanStatusQuery
} from "@signa/api/modules/ballot/application/queries";

const GenerateBallotsRoute = ContractRoute(generateBallotsContract, {
  summary: "Generate ballots for an election (async)"
});

const GetUploadUrlRoute = ContractRoute(getUploadUrlContract, {
  summary: "Get presigned URL for uploading ballot scan"
});

const ProcessBallotScanRoute = ContractRoute(processBallotScanContract, {
  summary: "Process a ballot scan via OMR"
});

const PreviewBallotRoute = ContractRoute(previewBallotContract, {
  summary: "Preview a ballot design before generating"
});

const GetBallotRoute = ContractRoute(getBallotContract, {
  summary: "Get a ballot by ID"
});

const ListBallotsRoute = ContractRoute(listBallotsContract, {
  summary: "List ballots with pagination and filters"
});

const ListScanRequestsRoute = ContractRoute(listScanRequestsContract, {
  summary: "List user's scan requests"
});

const GetScanRequestRoute = ContractRoute(getScanRequestContract, {
  summary: "Get scan request by ID for polling"
});

const PollScanStatusRoute = ContractRoute(pollScanStatusContract, {
  summary: "Poll for scan request status updates"
});

const RetryScanRoute = ContractRoute(retryScanContract, {
  summary: "Retry a failed or rejected scan request"
});

@ApiTags("BALLOTS")
@Controller()
export class BallotController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @GenerateBallotsRoute
  @Protected()
  @Response({ type: GenerateBallotsOutputDto })
  @HttpCode(HttpStatus.ACCEPTED)
  async generate(@Body() dto: GenerateBallotsInputDto, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(
      new GenerateBallotsCommand({
        electionId: dto.electionId,
        count: dto.count
      })
    );
  }

  @PreviewBallotRoute
  @Protected()
  @Response({ type: PreviewBallotOutputDto })
  @HttpCode(HttpStatus.OK)
  async preview(@Body() dto: PreviewBallotInputDto, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(
      new PreviewBallotCommand({
        electionId: dto.electionId,
        formStructure: dto.formStructure
      })
    );
  }

  @GetUploadUrlRoute
  @Protected()
  @Response({ type: GetUploadUrlOutputDto })
  @HttpCode(HttpStatus.OK)
  async getUploadUrl(
    @Param() params: GetUploadUrlParamsDto,
    @Body() dto: GetUploadUrlInputDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.commandBus.execute(
      new GetUploadUrlCommand({
        ballotId: params.ballotId,
        contentType: dto.contentType
      })
    );
  }

  @ProcessBallotScanRoute
  @Protected()
  @Response({ type: ProcessBallotScanOutputDto })
  @HttpCode(HttpStatus.ACCEPTED)
  async processScan(
    @Param() params: ProcessBallotScanParamsDto,
    @Body() dto: ProcessBallotScanInputDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.commandBus.execute(
      new ProcessBallotScanCommand({
        ballotId: params.ballotId,
        s3Key: dto.s3Key,
        userId: user.id
      })
    );
  }

  @GetBallotRoute
  @Protected()
  @Response({ type: GetBallotOutputDto })
  @HttpCode(HttpStatus.OK)
  async getById(@Param() params: GetBallotParamsDto, @CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new GetBallotByIdQuery({ id: params.id }));
  }

  @ListBallotsRoute
  @Protected()
  @Response({ type: ListBallotsOutputDto })
  @HttpCode(HttpStatus.OK)
  async list(@Query() query: ListBallotsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(
      new ListBallotsQuery({
        pageIndex: query.pageIndex,
        pageSize: query.pageSize,
        sortBy: query.sortBy,
        order: query.order,
        electionId: query.electionId,
        status: query.status
      })
    );
  }

  @ListScanRequestsRoute
  @Protected()
  @Response({ type: ListScanRequestsOutputDto })
  @HttpCode(HttpStatus.OK)
  async listScanRequests(@Query() query: ListScanRequestsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(
      new ListScanRequestsQuery({
        userId: user.id,
        pageIndex: query.pageIndex,
        pageSize: query.pageSize
      })
    );
  }

  @GetScanRequestRoute
  @Protected()
  @Response({ type: GetScanRequestOutputDto })
  @HttpCode(HttpStatus.OK)
  async getScanRequest(@Param() params: GetScanRequestParamsDto, @CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(
      new GetScanRequestQuery({
        requestId: params.requestId,
        userId: user.id
      })
    );
  }

  @PollScanStatusRoute
  @Protected()
  @Response({ type: PollScanStatusOutputDto })
  @HttpCode(HttpStatus.OK)
  async pollScanStatus(@Query() query: PollScanStatusQueryDto, @CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(
      new PollScanStatusQuery({
        userId: user.id,
        since: query.since
      })
    );
  }

  @RetryScanRoute
  @Protected()
  @Response({ type: RetryScanOutputDto })
  @HttpCode(HttpStatus.ACCEPTED)
  async retryScan(
    @Param() params: RetryScanParamsDto,
    @Body() dto: RetryScanInputDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.commandBus.execute(
      new RetryBallotScanCommand({
        requestId: params.requestId,
        s3Key: dto.s3Key,
        userId: user.id
      })
    );
  }
}
