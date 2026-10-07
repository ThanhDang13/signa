import { BaseEntity, Accessor } from "@signa/nest-property";
import { v7 as uuidv7 } from "uuid";

export type ValidationStatus =
  | "valid"
  | "invalid_markers"
  | "invalid_qr"
  | "invalid_selections"
  | "invalid_confidence"
  | "rejected_election_closed";

export type ScanSelection = {
  fieldId: string;
  selectedValues: string[];
  confidence: number;
};

export type ProcessingMetadata = {
  markersDetected: boolean;
  alignmentApplied: boolean;
};

export type ValidationError = {
  fieldId?: string;
  reason: string;
};

export class BallotScanResult extends BaseEntity {
  @Accessor({ readonly: true })
  public readonly id!: string;

  @Accessor({ readonly: true })
  public readonly requestId!: string;

  @Accessor({ readonly: true })
  public readonly ballotId!: string;

  @Accessor({ readonly: true })
  public readonly userId!: string;

  @Accessor({ readonly: true })
  public readonly s3Key!: string;

  @Accessor({ readonly: true })
  public readonly selections!: ScanSelection[];

  @Accessor({ readonly: true })
  public readonly qrVerified!: boolean;

  @Accessor({ readonly: true })
  public readonly processingMetadata!: ProcessingMetadata;

  @Accessor({ readonly: true })
  public readonly validationStatus!: ValidationStatus;

  @Accessor({ readonly: true })
  public readonly validationErrors?: ValidationError[];

  @Accessor({ readonly: true })
  public readonly processedAt!: Date;

  private constructor(
    props: {
      id: string;
      requestId: string;
      ballotId: string;
      userId: string;
      s3Key: string;
      selections: ScanSelection[];
      qrVerified: boolean;
      processingMetadata: ProcessingMetadata;
      validationStatus: ValidationStatus;
      validationErrors?: ValidationError[];
      processedAt: Date;
    },
    isNew = true
  ) {
    super(isNew);
    this.id = props.id;
    this.requestId = props.requestId;
    this.ballotId = props.ballotId;
    this.userId = props.userId;
    this.s3Key = props.s3Key;
    this.selections = props.selections;
    this.qrVerified = props.qrVerified;
    this.processingMetadata = props.processingMetadata;
    this.validationStatus = props.validationStatus;
    this.validationErrors = props.validationErrors;
    this.processedAt = props.processedAt;
  }

  static create(props: {
    requestId: string;
    ballotId: string;
    userId: string;
    s3Key: string;
    selections: ScanSelection[];
    qrVerified: boolean;
    processingMetadata: ProcessingMetadata;
    validationStatus: ValidationStatus;
    validationErrors?: ValidationError[];
  }): BallotScanResult {
    return new BallotScanResult(
      {
        id: uuidv7(),
        requestId: props.requestId,
        ballotId: props.ballotId,
        userId: props.userId,
        s3Key: props.s3Key,
        selections: props.selections,
        qrVerified: props.qrVerified,
        processingMetadata: props.processingMetadata,
        validationStatus: props.validationStatus,
        validationErrors: props.validationErrors,
        processedAt: new Date()
      },
      true
    ).finishInitialization();
  }

  static rehydrate(props: {
    id: string;
    requestId: string;
    ballotId: string;
    userId: string;
    s3Key: string;
    selections: ScanSelection[];
    qrVerified: boolean;
    processingMetadata: ProcessingMetadata;
    validationStatus: ValidationStatus;
    validationErrors?: ValidationError[];
    processedAt: string;
    createdAt: string;
    updatedAt: string;
  }): BallotScanResult {
    const result = new BallotScanResult(
      {
        id: props.id,
        requestId: props.requestId,
        ballotId: props.ballotId,
        userId: props.userId,
        s3Key: props.s3Key,
        selections: props.selections,
        qrVerified: props.qrVerified,
        processingMetadata: props.processingMetadata,
        validationStatus: props.validationStatus,
        validationErrors: props.validationErrors,
        processedAt: new Date(props.processedAt)
      },
      false
    );
    result.createdAt = new Date(props.createdAt);
    result.updatedAt = new Date(props.updatedAt);
    return result.finishInitialization();
  }

  isValid(): boolean {
    return this.validationStatus === "valid";
  }
}
