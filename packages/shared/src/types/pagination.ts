import { paginationMetadataSchema } from "../schemas";
import z from "zod";

export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;
