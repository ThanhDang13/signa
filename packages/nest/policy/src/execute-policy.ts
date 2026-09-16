import type { Policy, PolicyContext, PolicyDecision } from "@signa/dsl-policy";
import { authorize, evaluatePolicy } from "@signa/dsl-policy";

export const executePolicy = async <TContext extends PolicyContext>(
  policy: Policy<TContext>,
  context: TContext,
  options?: { throwOnDeny?: boolean }
): Promise<PolicyDecision> => {
  if (options?.throwOnDeny ?? true) {
    return authorize(policy, context);
  }
  return evaluatePolicy(policy, context);
};
