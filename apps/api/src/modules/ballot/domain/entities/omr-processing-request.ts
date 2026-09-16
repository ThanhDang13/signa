import { BaseEntity, Accessor } from "@signa/nest-property";
import { v7 as uuidv7 } from "uuid";

export type OmrRequestStatus = "pending" | "processing" | "completed" | "failed";

export class OmrProcessingRequest extends BaseEntity {
  @Accessor({ readonly: true })
  public readonly id!: string;

  @Accessor({ readonly: true })
  public readonly ballotId!: string;

  @Accessor({ readonly: true })
  public readonly s3Key!: string;

  @Accessor({ touchOnSet: true })
  public status!: OmrRequestStatus;

  @Accessor({ touchOnSet: true })
  public attempts!: number;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public lastError?: string;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public processedAt?: Date;

  private constructor(
    props: {
      id: string;
      ballotId: string;
      s3Key: string;
      status: OmrRequestStatus;
      attempts: number;
      lastError?: string;
      processedAt?: Date;
    },
    isNew = true
  ) {
    super(isNew);
    this.id = props.id;
    this.ballotId = props.ballotId;
    this.s3Key = props.s3Key;
    this.status = props.status;
    this.attempts = props.attempts;
    this.lastError = props.lastError;
    this.processedAt = props.processedAt;
  }

  static create(props: { ballotId: string; s3Key: string }): OmrProcessingRequest {
    return new OmrProcessingRequest({
      id: uuidv7(),
      ballotId: props.ballotId,
      s3Key: props.s3Key,
      status: "pending",
      attempts: 0
    }).finishInitialization();
  }

  static rehydrate(props: {
    id: string;
    ballotId: string;
    s3Key: string;
    status: OmrRequestStatus;
    attempts: number;
    lastError?: string;
    processedAt?: string;
    createdAt: string;
    updatedAt: string;
  }): OmrProcessingRequest {
    const request = new OmrProcessingRequest(
      {
        id: props.id,
        ballotId: props.ballotId,
        s3Key: props.s3Key,
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
}
