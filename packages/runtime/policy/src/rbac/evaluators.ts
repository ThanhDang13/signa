import { allow, deny, Policy, PolicyContext } from "@signa/dsl-policy";
import { HasRoles, HasPermissions, Role, Permission } from "./contracts";
import { ROLE_MISSING, PERMISSION_MISSING, SCOPE_MISSING } from "../core/error-codes";
import { PermissionRules, RoleRules, ScopeRules } from "./rules";

export const hasRole = <TContext extends PolicyContext<HasRoles>>(
  ...roles: readonly Role[]
): Policy<TContext> => {
  return (context) => {
    const subjectRoles = context.subject?.roles ?? [];
    const ok = RoleRules.hasAny(subjectRoles, roles);
    return ok
      ? allow()
      : deny(ROLE_MISSING.defaultMessage, ROLE_MISSING.code, [`hasRole(${roles.join(", ")})`]);
  };
};

export const hasPermission = <TContext extends PolicyContext<HasPermissions>>(
  ...permissions: readonly Permission[]
): Policy<TContext> => {
  return (context) => {
    const subjectPermissions = context.subject?.permissions ?? [];
    const ok = PermissionRules.hasAll(subjectPermissions, permissions);
    return ok
      ? allow()
      : deny(PERMISSION_MISSING.defaultMessage, PERMISSION_MISSING.code, [
          `hasPermission(${permissions.join(", ")})`
        ]);
  };
};

export const inScope = <TContext extends PolicyContext>(scope: string): Policy<TContext> => {
  return (context) => {
    const ok = ScopeRules.includes(context.scopes ?? [], scope);
    return ok
      ? allow()
      : deny(SCOPE_MISSING.defaultMessage, SCOPE_MISSING.code, [`inScope(${scope})`]);
  };
};
