export type PolicyEffect = "allow" | "deny";

export interface PolicyDecision {
  effect: PolicyEffect;
  reason?: string;
  code?: string;
  failedPolicies?: string[];
}

export interface PolicyContext<
  TSubject = unknown,
  TResource = unknown,
  TScope = string,
  TEnvironment extends Record<string, unknown> = Record<string, unknown>
> {
  subject?: TSubject;
  resource?: TResource;
  scopes?: readonly TScope[];
  action?: string;
  now?: Date;
  environment?: TEnvironment;
}

export type PolicyInput<TContext extends PolicyContext = PolicyContext> = TContext;

export type Policy<TContext extends PolicyContext = PolicyContext> = (
  context: PolicyInput<TContext>
) => PolicyResult | Promise<PolicyResult>;

export type PolicyResult = PolicyDecision;

export interface PolicyResourceResolver<TResource = unknown, TOptions = unknown> {
  resolve(ctx: unknown, options: TOptions): Promise<TResource> | TResource;
}

export interface PolicyResourceResolverDescriptor<TOptions = unknown> {
  resolver: Type<PolicyResourceResolver<any, TOptions>>;
  options: TOptions;
}

export interface PolicySubjectResolver<
  TPartial extends object,
  TContext extends object = TPartial
> {
  resolve(ctx: unknown, accumulated: Partial<TContext>): Promise<TPartial> | TPartial;
}

export type Type<T = any> = new (...args: any[]) => T;

export type PolicySubjectOf<P> =
  P extends Policy<PolicyContext<infer S, any, any, any>> ? S : never;
export type PolicyResourceOf<P> =
  P extends Policy<PolicyContext<any, infer R, any, any>> ? R : never;

export type SubjectOf<P> = P extends PolicyDefinition<infer S, any> ? S : never;

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type InferSubject<R> =
  R extends Type<PolicySubjectResolver<infer P, any>>
    ? P
    : R extends readonly unknown[]
      ? UnionToIntersection<{ [K in keyof R]: InferSubject<R[K]> }[number & keyof R]>
      : object;

export interface PolicyDefinition<TSubject extends object = object, TResource = unknown> {
  name: string;
  evaluate: Policy<PolicyContext<TSubject, TResource>>;
  resolveResource?: PolicyResourceResolverDescriptor | readonly PolicyResourceResolverDescriptor[];
  resolveSubject?:
    | Type<PolicySubjectResolver<any, TSubject>>
    | readonly Type<PolicySubjectResolver<any, TSubject>>[];
}
