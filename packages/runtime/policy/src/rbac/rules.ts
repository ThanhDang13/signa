import { Role, Permission } from "./contracts";

export const RoleRules = {
  hasAny: (subjectRoles: readonly Role[], requiredRoles: readonly Role[]): boolean =>
    requiredRoles.some((role) => subjectRoles.includes(role))
};

export const PermissionRules = {
  hasAll: (
    subjectPermissions: readonly Permission[],
    requiredPermissions: readonly Permission[]
  ): boolean => requiredPermissions.every((permission) => subjectPermissions.includes(permission))
};

export const ScopeRules = {
  includes: (subjectScopes: readonly string[], scope: string): boolean =>
    subjectScopes.includes(scope)
};
