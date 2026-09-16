/**
 * Resolves and enriches the subject for policy evaluation.
 * Part of a resolver chain that progressively builds up the subject.
 * Each resolver receives the accumulated result from previous resolvers
 * and returns only its own partial contribution.
 *
 * Generic TPartial defines the partial subject shape returned by this resolver.
 */
// export interface PolicySubjectResolver<TPartial = Record<string, unknown>> {
//   resolve(ctx: unknown, accumulated: Record<string, unknown>): Promise<TPartial> | TPartial;
// }

export interface PolicyRequest {
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
}
