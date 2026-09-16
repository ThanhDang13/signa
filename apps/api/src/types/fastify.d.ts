import "@signa/nest-jwt";
import { JwtPayload } from "@signa/nest-jwt";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export {};
