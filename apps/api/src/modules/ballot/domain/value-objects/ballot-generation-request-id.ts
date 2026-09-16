import { v7 as uuidv7 } from "uuid";

export class BallotGenerationRequestId {
  private constructor(private readonly id: string) {}

  static create(): BallotGenerationRequestId {
    return new BallotGenerationRequestId(uuidv7());
  }

  static rehydrate(id: string): BallotGenerationRequestId {
    return new BallotGenerationRequestId(id);
  }

  toString(): string {
    return this.id;
  }

  equals(other: BallotGenerationRequestId): boolean {
    return this.id === other.id;
  }
}
