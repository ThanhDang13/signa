export type Identifier = string | number;

export interface HasId {
  id: Identifier;
}

export interface HasOwnerId {
  ownerId: Identifier;
}
