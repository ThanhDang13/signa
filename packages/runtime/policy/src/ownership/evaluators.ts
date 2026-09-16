import { allow, deny, Policy, PolicyContext } from "@signa/dsl-policy";
import { HasId, HasOwnerId } from "./contracts";
import { NOT_OWNER } from "../core/error-codes";
import { OwnershipRules } from "./rules";

export const isOwner = <TContext extends PolicyContext<HasId, HasOwnerId>>(): Policy<TContext> => {
  return (context) => {
    const ok = OwnershipRules.isOwner(context.subject?.id, context.resource?.ownerId);
    return ok ? allow() : deny(NOT_OWNER.defaultMessage, NOT_OWNER.code, ["isOwner()"]);
  };
};

/**
 * Evaluator that allows access when the resource has no owner.
 * Used for resource creation where the owner hasn't been assigned yet.
 *
 * Example: Creating a new conversation where conversationId is optional.
 * When conversationId is blank, the resource resolver returns { ownerId: "" },
 * and this evaluator allows the request to proceed.
 */
export const hasNoOwnerId = <
  TContext extends PolicyContext<any, HasOwnerId>
>(): Policy<TContext> => {
  return (context) => {
    const ownerId = context.resource?.ownerId;
    return !ownerId
      ? allow("No owner - new resource")
      : deny("Resource has an owner", "hasNoOwnerId()");
  };
};
