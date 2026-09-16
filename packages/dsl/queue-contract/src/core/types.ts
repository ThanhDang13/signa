/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from "zod";
import type { JobContract } from "./contract";

/**
 * Infer the data type from a job contract
 */
export type InferJobData<T extends JobContract> = z.infer<T["data"]>;

/**
 * Infer the result type from a job contract
 */
export type InferJobResult<T extends JobContract> = z.infer<T["result"]>;
