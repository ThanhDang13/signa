import type { Contract } from "@signa/dsl-http-contract";
import { Get, Post, Put, Delete, Patch, applyDecorators } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type NestMethodDecorator = (path?: string | string[]) => MethodDecorator;

const METHOD_DECORATOR_MAP = {
  GET: Get,
  POST: Post,
  PUT: Put,
  DELETE: Delete,
  PATCH: Patch
} as const satisfies Record<HttpMethod, NestMethodDecorator>;

type ContractRouteOptions = {
  summary?: string;
  description?: string;
  tags?: string[];
};

export function ContractRoute(
  contract: Contract,
  options: ContractRouteOptions = {}
): MethodDecorator {
  const methodDecorator = METHOD_DECORATOR_MAP[contract.method];

  const decorators: (MethodDecorator | ClassDecorator)[] = [methodDecorator(contract.path)];

  if (options.summary || options.description) {
    decorators.push(
      ApiOperation({
        summary: options.summary,
        description: options.description
      })
    );
  }

  return applyDecorators(...decorators);
}
