import { Global, Module } from "@nestjs/common";
import { RoleSubjectResolver } from "./role-subject.resolver";

/**
 * Global module that registers application-specific policy resolvers
 * and makes them available throughout the application
 */
@Global()
@Module({
  providers: [RoleSubjectResolver],
  exports: [RoleSubjectResolver]
})
export class PolicyConfigModule {}
