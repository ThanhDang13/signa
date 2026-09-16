import { CanActivate, Injectable, type ExecutionContext, Logger } from "@nestjs/common";
import { Reflector, ModuleRef } from "@nestjs/core";
import { authorize, type PolicyContext, type PolicyDefinition } from "@signa/dsl-policy";
import { isDslError, createError, type DslError } from "@signa/dsl-error";
import { SUBJECT_RESOLUTION_FAILED } from "./core/error-codes";
import { POLICY_METADATA_KEY } from "./constants";
import { NestContextProvider } from "./context/nest-context-provider";

@Injectable()
export class PolicyGuard implements CanActivate {
  private readonly logger = new Logger(PolicyGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly contextProvider: NestContextProvider,
    private readonly moduleRef: ModuleRef
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const policyDefinition = this.reflector.getAllAndOverride<PolicyDefinition>(
      POLICY_METADATA_KEY,
      [executionContext.getHandler(), executionContext.getClass()]
    );

    if (!policyDefinition) {
      return true;
    }

    let subject = this.contextProvider.resolveSubject(executionContext);
    const scopes = this.contextProvider.resolveScopes(executionContext);
    const environment = this.contextProvider.resolveEnvironment(executionContext);

    if (policyDefinition.resolveSubject) {
      const resolvers = Array.isArray(policyDefinition.resolveSubject)
        ? policyDefinition.resolveSubject
        : [policyDefinition.resolveSubject];

      let accumulated: Record<string, unknown> = {};
      for (const ResolverClass of resolvers) {
        try {
          const resolver = this.moduleRef.get(ResolverClass, { strict: false });
          if (resolver && typeof resolver.resolve === "function") {
            this.logger.debug(`Executing resolver ${ResolverClass.name} in subject chain`);
            const result = await resolver.resolve(executionContext, accumulated);
            accumulated = { ...accumulated, ...(result as Record<string, unknown>) };
            this.logger.debug(`Resolver ${ResolverClass.name} returned: ${JSON.stringify(result)}`);
          }
        } catch (error) {
          throw createError(SUBJECT_RESOLUTION_FAILED.code, {
            cause: error instanceof Error ? error : new Error(String(error)),
            context: {
              resolverName: ResolverClass.name,
              originalError: error instanceof Error ? error.message : String(error)
            }
          });
        }
      }

      subject = { ...(subject as Record<string, unknown>), ...accumulated };
    }

    if (policyDefinition.resolveResource) {
      const descriptors = Array.isArray(policyDefinition.resolveResource)
        ? policyDefinition.resolveResource
        : [policyDefinition.resolveResource];

      for (const { resolver: ResolverClass, options } of descriptors) {
        let resource: unknown;

        try {
          const resolver = this.moduleRef.get(ResolverClass, { strict: false });

          if (!resolver || typeof resolver.resolve !== "function") {
            throw createError(SUBJECT_RESOLUTION_FAILED.code, {
              context: {
                resolverName: ResolverClass.name,
                reason: "Resolver not found or invalid"
              }
            });
          }

          this.logger.debug(`Executing resource resolver ${ResolverClass.name}`);
          resource = await resolver.resolve(executionContext, options);
          this.logger.debug(`Resource resolved: ${JSON.stringify(resource)}`);
        } catch (error) {
          if (isDslError(error)) throw error;
          throw createError(SUBJECT_RESOLUTION_FAILED.code, {
            cause: error instanceof Error ? error : new Error(String(error)),
            context: {
              resolverName: ResolverClass.name,
              originalError: error instanceof Error ? error.message : String(error)
            }
          });
        }

        const context: PolicyContext<Record<string, unknown>, unknown> = {
          subject: subject as Record<string, unknown>,
          resource,
          scopes,
          environment,
          now: new Date()
        };

        await authorize(policyDefinition.evaluate, context);
      }

      return true;
    }

    const context: PolicyContext<Record<string, unknown>, unknown> = {
      subject: subject as Record<string, unknown>,
      resource: undefined,
      scopes,
      environment,
      now: new Date()
    };

    await authorize(policyDefinition.evaluate, context);
    const req = executionContext.switchToHttp().getRequest();
    req.subject = subject;
    return true;
  }
}
