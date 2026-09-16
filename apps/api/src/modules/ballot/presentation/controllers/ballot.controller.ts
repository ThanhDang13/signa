import { Body, Controller, HttpCode, HttpStatus, Post, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CommandBus } from "@nestjs/cqrs";
import { ContractRoute, Response } from "@signa/nest-contract";
import { generateBallotsContract, getUploadUrlContract, processBallotScanContract, previewBallotContract } from "@signa/contracts-http/ballot";
import { GenerateBallotsCommand, GetUploadUrlCommand, ProcessBallotScanCommand, PreviewBallotCommand } from "@signa/api/modules/ballot/application/commands";
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
import { Protected } from "@signa/api/core/security/decorator";
import { CurrentUser, type JwtPayload } from "@signa/nest-jwt";

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

@ApiTags("BALLOTS")
@Controller()
export class BallotController {
  constructor(private readonly commandBus: CommandBus) {}

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
        s3Key: dto.s3Key
      })
    );
  }
}
