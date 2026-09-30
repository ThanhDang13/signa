import { defineContract } from "@signa/dsl-http-contract";
import {
  getUploadUrlParamsSchema,
  getUploadUrlSchema,
  getUploadUrlResponseSchema
} from "../schemas/get-upload-url.schema";

export const getUploadUrlContract = defineContract({
  method: "POST",
  path: "/v1/ballots/:ballotId/upload-url",
  params: getUploadUrlParamsSchema,
  body: getUploadUrlSchema,
  response: getUploadUrlResponseSchema
});
