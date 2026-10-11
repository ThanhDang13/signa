import { Injectable } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { PolicySubjectResolver } from "@signa/nest-policy";
import type { HasId, HasRoles } from "@signa/runtime-policy";
import { FastifyRequest } from "fastify";

export interface RoleSubjectData extends HasId, HasRoles {}

@Injectable()
export class RoleSubjectResolver implements PolicySubjectResolver<RoleSubjectData> {
  resolve(
    ctx: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accumulated: Record<string, unknown>
  ): Promise<RoleSubjectData> | RoleSubjectData {
    const executionContext = ctx as ExecutionContext;
    const request = executionContext.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user;

    if (!user || !user.id) {
      return {
        id: "",
        roles: []
      };
    }

    return {
      id: user.id,
      roles: user.roles ?? []
    };
  }
}
