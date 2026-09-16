export type Role = string;
export type Permission = string;

export interface HasRoles {
  roles: readonly Role[];
}

export interface HasPermissions {
  permissions: readonly Permission[];
}
