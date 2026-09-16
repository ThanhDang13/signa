import { BallotGenerationRequestId } from "@signa/api/modules/ballot/domain/value-objects";
import { BaseEntity, Accessor } from "@signa/nest-property";

export type RequestStatus = "pending" | "processing" | "completed" | "failed";

export class BallotGenerationRequest extends BaseEntity {
  @Accessor({ readonly: true })
  public readonly id!: BallotGenerationRequestId;

  @Accessor({ readonly: true })
  public readonly electionId!: string;

  @Accessor({ readonly: true })
  public readonly ballotIds!: string[];

  @Accessor({ readonly: true })
  public readonly timestamp!: Date;

  @Accessor({ touchOnSet: true })
  public status!: RequestStatus;

  @Accessor({ touchOnSet: true })
  public attempts!: number;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public lastError?: string;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public processedAt?: Date;

  private constructor(
    props: {
      id: BallotGenerationRequestId;
      electionId: string;
      ballotIds: string[];
      timestamp: Date;
      status: RequestStatus;
      attempts: number;
      lastError?: string;
      processedAt?: Date;
    },
    isNew = true
  ) {
    super(isNew);
    this.id = props.id;
    this.electionId = props.electionId;
    this.ballotIds = props.ballotIds;
    this.timestamp = props.timestamp;
    this.status = props.status;
    this.attempts = props.attempts;
    this.lastError = props.lastError;
    this.processedAt = props.processedAt;
  }

  static create(props: { electionId: string; ballotIds: string[] }): BallotGenerationRequest {
    return new BallotGenerationRequest({
      id: BallotGenerationRequestId.create(),
      electionId: props.electionId,
      ballotIds: props.ballotIds,
      timestamp: new Date(),
      status: "pending",
      attempts: 0
    }).finishInitialization();
  }

  static rehydrate(props: {
    id: string;
    electionId: string;
    ballotIds: string[];
    timestamp: string;
    status: RequestStatus;
    attempts: number;
    lastError?: string;
    processedAt?: string;
    createdAt: string;
    updatedAt: string;
  }): BallotGenerationRequest {
    const request = new BallotGenerationRequest(
      {
        id: BallotGenerationRequestId.rehydrate(props.id),
        electionId: props.electionId,
        ballotIds: props.ballotIds,
        timestamp: new Date(props.timestamp),
        status: props.status,
        attempts: props.attempts,
        lastError: props.lastError,
        processedAt: props.processedAt ? new Date(props.processedAt) : undefined
      },
      false
    );
    request.createdAt = new Date(props.createdAt);
    request.updatedAt = new Date(props.updatedAt);
    return request.finishInitialization();
  }

  markAsProcessing(): void {
    this.status = "processing";
  }

  markAsCompleted(): void {
    this.status = "completed";
    this.processedAt = new Date();
  }

  markAsFailed(error: string): void {
    this.status = "failed";
    this.lastError = error;
  }

  incrementAttempts(): void {
    this.attempts += 1;
  }

  canRetry(maxAttempts: number): boolean {
    return this.attempts < maxAttempts && this.status !== "completed";
  }

  isPending(): boolean {
    return this.status === "pending";
  }
}
