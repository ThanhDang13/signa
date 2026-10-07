import { Query } from "@nestjs/cqrs";

export type GetClerkQueryPayload = {
  id: string;
};

export type GetClerkQueryResult = {
  id: string;
  email: string;
  fullname: string;
  avatar?: string;
  bio?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export class GetClerkQuery extends Query<GetClerkQueryResult> {
  constructor(public readonly payload: GetClerkQueryPayload) {
    super();
  }
}
