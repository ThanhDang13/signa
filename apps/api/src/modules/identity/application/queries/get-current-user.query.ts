import { Query } from "@nestjs/cqrs";

export type GetCurrentUserQueryPayload = {
  userId: string;
};

export type GetCurrentUserQueryResult = {
  id: string;
  email: string;
  fullname: string;
  avatar?: string;
  bio?: string;
  role: string;
};

export class GetCurrentUserQuery extends Query<GetCurrentUserQueryResult> {
  constructor(public readonly payload: GetCurrentUserQueryPayload) {
    super();
  }
}
