import { defineContract } from "@signa/dsl-http-contract";
import {
  previewBallotSchema,
  previewBallotResponseSchema
} from "../schemas/preview-ballot.schema";

export const previewBallotContract = defineContract({
  method: "POST",
  path: "/v1/ballots/preview",
  body: previewBallotSchema,
  response: previewBallotResponseSchema
});
