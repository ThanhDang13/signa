import { getCurrentUserResponseSchema } from "@signa/contracts-http/identity";
import { createZodDto } from "@signa/nest-contract";

export class GetCurrentUserOutputDto extends createZodDto(getCurrentUserResponseSchema) {}
