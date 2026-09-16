import { allow, deny } from "../core/result";
import type {
  Policy,
  PolicyContext,
  PolicyDefinition,
  PolicyResourceResolverDescriptor,
  PolicySubjectResolver,
  Type,
  UnionToIntersection
} from "../core/types";

type ResolveSubjectArg =
  Type<PolicySubjectResolver<any, any>> | readonly Type<PolicySubjectResolver<any, any>>[];

type InferSubject<R> =
  R extends Type<PolicySubjectResolver<infer P, any>>
    ? P
    : R extends readonly (infer Item)[]
      ? UnionToIntersection<{ [K in keyof R]: InferSubject<R[K]> }[number & keyof R]>
      : object;

export function policy<const TResolveSubject extends ResolveSubjectArg, TResource = unknown>(def: {
  name: string;
  evaluate: Policy<PolicyContext<InferSubject<TResolveSubject>, TResource>>;
  resolveResource?: PolicyResourceResolverDescriptor | readonly PolicyResourceResolverDescriptor[];
  resolveSubject: TResolveSubject;
}): PolicyDefinition<InferSubject<TResolveSubject>, TResource>;
export function policy<TSubject extends object = object, TResource = unknown>(
  def: PolicyDefinition<TSubject, TResource> & { resolveSubject?: undefined }
): PolicyDefinition<TSubject, TResource>;
export function policy(def: any): any {
  return def;
}

export const subjectSatisfies = <TContext extends PolicyContext>(
  predicate: (
    subject: NonNullable<TContext["subject"]>,
    context: TContext
  ) => boolean | Promise<boolean>,
  reason = "Subject constraint failed",
  code = "SUBJECT_CONSTRAINT_FAILED"
): Policy<TContext> => {
  return async (context) => {
    if (context.subject == null) {
      return deny(reason, code);
    }

    const ok = await predicate(context.subject as NonNullable<TContext["subject"]>, context);

    return ok ? allow() : deny(reason, code);
  };
};

export const resourceSatisfies = <TContext extends PolicyContext>(
  predicate: (
    resource: NonNullable<TContext["resource"]>,
    context: TContext
  ) => boolean | Promise<boolean>,
  reason = "Resource constraint failed",
  code = "RESOURCE_CONSTRAINT_FAILED"
): Policy<TContext> => {
  return async (context) => {
    if (context.resource == null) {
      return deny(reason, code);
    }

    const ok = await predicate(context.resource as NonNullable<TContext["resource"]>, context);

    return ok ? allow() : deny(reason, code);
  };
};
