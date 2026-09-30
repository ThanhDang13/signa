import { IQuery } from "@nestjs/cqrs";

export type PollScanStatusQueryPayload = {
  userId: string;
  since?: string;
};

export class PollScanStatusQuery implements IQuery {
  constructor(public readonly payload: PollScanStatusQueryPayload) {}
}
