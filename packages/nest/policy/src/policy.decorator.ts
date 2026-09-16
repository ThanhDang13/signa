import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards
} from "@nestjs/common";
import type { PolicyContext, PolicyDefinition } from "@signa/dsl-policy";
import { POLICY_METADATA_KEY } from "./constants";
import { PolicyGuard } from "./policy.guard";

export const UsePolicy = <TSubject extends object, TResource = unknown>(
  policyDefinition: PolicyDefinition<TSubject, TResource>
) => applyDecorators(SetMetadata(POLICY_METADATA_KEY, policyDefinition), UseGuards(PolicyGuard));

// Alias for backward compatibility
export const Policy = UsePolicy;

const subjectParamFactory = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().subject
);

export function PolicySubjectFor<P extends PolicyDefinition<any>>(
  _policyDef: P
): ParameterDecorator {
  return subjectParamFactory();
}
