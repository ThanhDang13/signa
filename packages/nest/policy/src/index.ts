export * from "./constants";
export * from "./types";
export * from "./policy.decorator";
export * from "./policy.guard";
export * from "./policy.module";
export * from "./execute-policy";
export * from "./interfaces";
export * from "./context/nest-context-provider";

// Re-export policy-dsl core types and functions
export type { ContextProvider, PolicyContext, SubjectOf } from "@signa/dsl-policy";
export { policy } from "@signa/dsl-policy";
export { and, or, not } from "@signa/dsl-policy";
export { evaluatePolicy, authorize } from "@signa/dsl-policy";
export { allow, deny, isAllowed } from "@signa/dsl-policy";
export type {
  PolicySubjectResolver,
  PolicyResourceResolver,
  PolicyResourceResolverDescriptor
} from "@signa/dsl-policy";
