import { z } from "zod";

/**
 * Standard paginated response metadata schema
 */
export const paginationMetadataSchema = z.object({
  pageIndex: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative()
});

/**
 * Factory function to create paginated response schemas
 * @param dataSchema - The Zod schema for individual items in the data array
 * @returns A schema with data array and pagination metadata
 */
export function paginatedResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: z.array(dataSchema),
    meta: paginationMetadataSchema
  });
}

/**
 * Base pagination query schema for backend list endpoints.
 * Each endpoint should extend this and add its own type-safe sortBy enum.
 */
export const basePaginationQuerySchema = z.object({
  pageIndex: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  order: z.enum(["asc", "desc"]).default("asc")
});

/**
 * Helper to create a type-safe pagination query schema with endpoint-specific sortBy fields.
 */
export function createPaginationQuerySchema<T extends z.ZodRawShape>(extensions: T) {
  return basePaginationQuerySchema.extend(extensions);
}
