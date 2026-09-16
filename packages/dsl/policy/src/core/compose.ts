import { allow, deny, isAllowed } from "./result";
import type {
  Policy,
  PolicyContext,
  PolicyDecision,
  PolicySubjectOf,
  UnionToIntersection
} from "./types";

export const and = <TPolicies extends readonly Policy<any>[]>(
  ...policies: TPolicies
): Policy<PolicyContext<UnionToIntersection<PolicySubjectOf<TPolicies[number]>>>> => {
  return async (context) => {
    for (const policy of policies) {
      const result = await policy(context as any);
      if (!isAllowed(result)) {
        return result;
      }
    }
    return allow();
  };
};

export const or = <TPolicies extends readonly Policy<any>[]>(
  ...policies: TPolicies
): Policy<PolicyContext<UnionToIntersection<PolicySubjectOf<TPolicies[number]>>>> => {
  return async (context) => {
    const denied: PolicyDecision[] = [];
    for (const policy of policies) {
      const result = await policy(context as any);
      if (isAllowed(result)) {
        return result;
      }
      denied.push(result);
    }
    const reasons = [...new Set(denied.map((d) => d.reason).filter(Boolean))];
    const failedPolicies = [...new Set(denied.flatMap((d) => d.failedPolicies ?? []))];
    return deny(reasons.join(" | ") || "No policy matched", undefined, failedPolicies);
  };
};

export const not = <TContext extends PolicyContext>(policy: Policy<TContext>): Policy<TContext> => {
  return async (context) => {
    const result = await policy(context);
    return isAllowed(result)
      ? deny(result.reason ? `NOT failed: ${result.reason}` : "NOT policy failed", undefined, [
          "not()"
        ])
      : allow();
  };
};
