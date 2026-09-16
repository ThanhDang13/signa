import type { PolicyDecision } from "./types";

export const allow = (reason?: string, code?: string): PolicyDecision => ({
  effect: "allow",
  reason,
  code
});

export const deny = (
  reason?: string,
  code?: string,
  failedPolicies?: string[]
): PolicyDecision => ({
  effect: "deny",
  reason,
  code,
  failedPolicies
});

export const isAllowed = (decision: PolicyDecision): boolean => decision.effect === "allow";
