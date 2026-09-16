import { createError } from "@signa/dsl-error";
import { POLICY_DENIED } from "./error-codes";
import { isAllowed } from "./result";
import type { Policy, PolicyContext, PolicyDecision, PolicyDefinition } from "./types";

export const evaluatePolicy = async <TContext extends PolicyContext>(
  policy: Policy<TContext>,
  context: TContext
): Promise<PolicyDecision> => {
  return policy(context);
};

export const authorize = async <TContext extends PolicyContext>(
  policy: Policy<TContext>,
  context: TContext
): Promise<PolicyDecision> => {
  const decision = await evaluatePolicy(policy, context);
  if (!isAllowed(decision)) {
    throw createError(POLICY_DENIED.code, {
      message: decision.reason ?? "Policy denied",
      context: {
        decision,
        policyContext: context
      }
    });
  }
  return decision;
};

export const authorizeWith = async <TSubject extends object, TResource = unknown>(
  policyDefinition: PolicyDefinition<TSubject, TResource>,
  context: PolicyContext<TSubject, TResource>
): Promise<PolicyDecision> => authorize(policyDefinition.evaluate, context);
