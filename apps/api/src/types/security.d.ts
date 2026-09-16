import "@signa/nest-jwt";
import { Role, UserId$ } from "@signa/shared";

declare module "@signa/nest-jwt" {
  interface JwtPayload {
    id: UserId$;
    roles: Role[];
  }
}

export {};
