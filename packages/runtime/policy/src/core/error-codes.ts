import { defineError } from "@signa/dsl-error";

// Policy contract error codes
export const ROLE_MISSING = defineError({
  code: "ROLE_MISSING",
  category: "forbidden",
  messageKey: "policy.role.missing",
  defaultMessage: "Subject is missing required role"
});

export const PERMISSION_MISSING = defineError({
  code: "PERMISSION_MISSING",
  category: "forbidden",
  messageKey: "policy.permission.missing",
  defaultMessage: "Subject is missing required permission"
});

export const SCOPE_MISSING = defineError({
  code: "SCOPE_MISSING",
  category: "forbidden",
  messageKey: "policy.scope.missing",
  defaultMessage: "Subject is missing required scope"
});

export const REGION_SCOPE_DENIED = defineError({
  code: "REGION_SCOPE_DENIED",
  category: "forbidden",
  messageKey: "policy.region.scope_denied",
  defaultMessage: "Subject region scope does not include resource region"
});

export const REGION_MISMATCH = defineError({
  code: "REGION_MISMATCH",
  category: "forbidden",
  messageKey: "policy.region.mismatch",
  defaultMessage: "Subject and resource are in different regions"
});

export const NOT_OWNER = defineError({
  code: "NOT_OWNER",
  category: "forbidden",
  messageKey: "policy.ownership.not_owner",
  defaultMessage: "Subject is not the owner of the resource"
});
