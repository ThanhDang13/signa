import { createZodDto } from "@signa/nest-contract";
import { getUploadUrlContract } from "@signa/contracts-http/ballot";

export class GetUploadUrlParamsDto extends createZodDto(getUploadUrlContract.pathParams) {}

export class GetUploadUrlInputDto extends createZodDto(getUploadUrlContract.body) {}

export class GetUploadUrlOutputDto extends createZodDto(getUploadUrlContract.response) {}
