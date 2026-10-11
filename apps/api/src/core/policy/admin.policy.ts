import { RoleSubjectResolver } from "./role-subject.resolver";
import { policy } from "@signa/nest-policy";
import { hasRole } from "@signa/runtime-policy";
import { ROLES } from "@signa/shared";

export const isAdmin = policy({
  name: "admin.access",
  evaluate: hasRole(ROLES.SUPER_ADMIN),
  resolveSubject: [RoleSubjectResolver]
});
