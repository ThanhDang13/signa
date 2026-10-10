import { defineContract } from "@signa/dsl-http-contract";
import {
  adminListScanRequestsQuerySchema,
  adminListScanRequestsResponseSchema
} from "../schemas/admin-list-scan-requests.schema";

export const adminListScanRequestsContract = defineContract({
  path: "/v1/admin/scan-requests",
  method: "GET",
  query: adminListScanRequestsQuerySchema,
  response: adminListScanRequestsResponseSchema
});
