import { defineContract } from "@signa/dsl-http-contract";
import {
  activateElectionResponseSchema,
  closeElectionResponseSchema,
  deleteElectionResponseSchema
} from "../schemas/election-actions.schema";
import { z } from "zod";

export const activateElectionContract = defineContract({
  method: "POST",
  path: "/v1/elections/:id/activate",
  params: z.object({ id: z.string().uuid() }),
  response: activateElectionResponseSchema
});

export const closeElectionContract = defineContract({
  method: "POST",
  path: "/v1/elections/:id/close",
  params: z.object({ id: z.string().uuid() }),
  response: closeElectionResponseSchema
});

export const deleteElectionContract = defineContract({
  method: "DELETE",
  path: "/v1/elections/:id",
  params: z.object({ id: z.string().uuid() }),
  response: deleteElectionResponseSchema
});
