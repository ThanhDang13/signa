import type { JobContract } from "@signa/dsl-queue-contract";

export const ON_JOB_RESULT_METADATA = "queue:on-job-result";

/**
 * Decorator for job result handlers
 * Marks a method to handle results from a specific job queue
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class OmrScanResultHandler {
 *   @OnJobResult(processBallotJob)
 *   async handleOmrResult(result: JobResult<InferJobResult<typeof processBallotJob>>) {
 *     // Process the job result
 *     // Return = ack, throw = retry (only for transient errors)
 *   }
 * }
 * ```
 */
export function OnJobResult<T extends JobContract>(contract: T): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    // Store contract metadata for discovery
    Reflect.defineMetadata(ON_JOB_RESULT_METADATA, contract, target.constructor, propertyKey);

    return descriptor;
  };
}
