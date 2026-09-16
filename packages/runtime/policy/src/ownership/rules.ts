import { Identifier } from "./contracts";

export const OwnershipRules = {
  isOwner: (subjectId?: Identifier, ownerId?: Identifier): boolean =>
    subjectId !== undefined && ownerId !== undefined && subjectId === ownerId
};
