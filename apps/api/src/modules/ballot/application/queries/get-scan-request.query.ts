import { IQuery } from "@nestjs/cqrs";

export type GetScanRequestQueryPayload = {
  requestId: string;
  userId: string;
};

export class GetScanRequestQuery implements IQuery {
  constructor(public readonly payload: GetScanRequestQueryPayload) {}
}
