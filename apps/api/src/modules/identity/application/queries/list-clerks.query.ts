import { Query } from "@nestjs/cqrs";

export type ListClerksQueryPayload = {
  pageIndex: number;
  pageSize: number;
  sortBy: "email" | "fullname" | "createdAt";
  order: "asc" | "desc";
};

export type ClerkReadModel = {
  id: string;
  email: string;
  fullname: string;
  avatar?: string;
  bio?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type ListClerksQueryResult = {
  data: ClerkReadModel[];
  meta: {
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

export class ListClerksQuery extends Query<ListClerksQueryResult> {
  constructor(public readonly payload: ListClerksQueryPayload) {
    super();
  }
}
