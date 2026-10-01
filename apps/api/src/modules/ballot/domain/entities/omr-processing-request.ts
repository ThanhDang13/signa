import { BaseEntity, Accessor } from "@signa/nest-property";
import { v7 as uuidv7 } from "uuid";

export type OmrRequestStatus = "pending" | "processing" | "completed" | "failed";

export class OmrProcessingRequest extends BaseEntity {
  @Accessor({ readonly: true })
  public readonly id!: string;

  @Accessor({ readonly: true })
  public readonly ballotId!: string;

  @Accessor({ readonly: true })
  public readonly userId!: string;

  @Accessor({ touchOnSet: true })
  public s3Key!: string;

  @Accessor({ touchOnSet: true })
  public status!: OmrRequestStatus;

  @Accessor({ touchOnSet: true })
  public attempts!: number;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public lastError?: string;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public processedAt?: Date;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public processingStartedAt?: Date;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public dispatchId?: string;

  private constructor(
    props: {
      id: string;
      ballotId: string;
      userId: string;
      s3Key: string;
      status: OmrRequestStatus;
      attempts: number;
      dispatchId?: string;
      lastError?: string;
      processedAt?: Date;
      processingStartedAt?: Date;
    },
    isNew = true
  ) {
    super(isNew);
    this.id = props.id;
    this.ballotId = props.ballotId;
    this.userId = props.userId;
    this.s3Key = props.s3Key;
    this.status = props.status;
    this.attempts = props.attempts;
    this.dispatchId = props.dispatchId;
    this.lastError = props.lastError;
    this.processedAt = props.processedAt;
    this.processingStartedAt = props.processingStartedAt;
  }

  static create(props: { ballotId: string; userId: string; s3Key: string }): OmrProcessingRequest {
    return new OmrProcessingRequest({
      id: uuidv7(),
      ballotId: props.ballotId,
      userId: props.userId,
      s3Key: props.s3Key,
      status: "pending",
      attempts: 0
    }).finishInitialization();
  }

  static rehydrate(props: {
    id: string;
    ballotId: string;
    userId: string;
    s3Key: string;
    status: OmrRequestStatus;
    attempts: number;
    dispatchId?: string;
    lastError?: string;
    processedAt?: string;
    processingStartedAt?: string;
    createdAt: string;
    updatedAt: string;
  }): OmrProcessingRequest {
    const request = new OmrProcessingRequest(
      {
        id: props.id,
        ballotId: props.ballotId,
        userId: props.userId,
        s3Key: props.s3Key,
        status: props.status,
        attempts: props.attempts,
        dispatchId: props.dispatchId,
        lastError: props.lastError,
        processedAt: props.processedAt ? new Date(props.processedAt) : undefined,
        processingStartedAt: props.processingStartedAt ? new Date(props.processingStartedAt) : undefined
      },
      false
    );
    request.createdAt = new Date(props.createdAt);
    request.updatedAt = new Date(props.updatedAt);
    return request.finishInitialization();
  }

  markAsProcessing(): void {
    this.status = "processing";
    this.processingStartedAt = new Date();
  }

  markAsCompleted(): void {
    this.status = "completed";
    this.processedAt = new Date();
  }

  markAsFailed(error: string): void {
    this.status = "failed";
    this.lastError = error;
    this.processedAt = new Date();
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

  isActive(): boolean {
    return this.status === "pending" || this.status === "processing";
  }

  isTerminal(): boolean {
    return this.status === "completed" || this.status === "failed";
  }

  resetForRetry(newS3Key: string): void {
    this.s3Key = newS3Key;
    this.status = "pending";
    this.attempts = 0;
    this.dispatchId = undefined;
    this.lastError = undefined;
    this.processedAt = undefined;
    this.processingStartedAt = undefined;
  }

  generateDispatchId(): void {
    this.dispatchId = uuidv7();
  }
}
