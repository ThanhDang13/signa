import type { JobContract } from "@signa/dsl-queue-contract";

/**
 * Decorator for job handlers that use queue contracts
 * Stores contract metadata for runtime validation
 *
 * @example
 * ```typescript
 * @Processor('scan')
 * export class ScanProcessor {
 *   @JobHandler(processBallotJob)
 *   async handleProcessBallot(
 *     job: Job<InferJobData<typeof processBallotJob>>
 *   ): Promise<InferJobResult<typeof processBallotJob>> {
 *     // Handler implementation
 *   }
 * }
 * ```
 */
export function JobHandler<T extends JobContract>(contract: T): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    // Store contract metadata for runtime validation
    Reflect.defineMetadata("queue:contract", contract, descriptor.value);
    Reflect.defineMetadata("queue:job-name", contract.job, descriptor.value);

    return descriptor;
  };
}
