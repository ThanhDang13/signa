import { BallotId } from "@signa/api/modules/ballot/domain/value-objects";
import { BaseEntity, Accessor } from "@signa/nest-property";
import type { BallotStatus, BallotSignature, BallotLayout } from "@signa/shared";
import { BALLOT_STATUSES } from "@signa/shared";

export class Ballot extends BaseEntity {
  @Accessor({ readonly: true })
  public readonly id!: BallotId;

  @Accessor({ readonly: true })
  public readonly electionId!: string;

  @Accessor({ readonly: true })
  public readonly signature!: BallotSignature;

  @Accessor({ touchOnSet: true })
  public status!: BallotStatus;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public pdfS3Key?: string;

  @Accessor({ readonly: true })
  public readonly qrCodeData!: string;

  @Accessor({ readonly: true })
  public readonly layoutMetadata!: BallotLayout;

  @Accessor({ readonly: true })
  public readonly generatedAt!: Date;

  private constructor(
    props: {
      id: BallotId;
      electionId: string;
      signature: BallotSignature;
      status: BallotStatus;
      pdfS3Key?: string;
      qrCodeData: string;
      layoutMetadata: BallotLayout;
      generatedAt: Date;
    },
    isNew = true
  ) {
    super(isNew);
    this.id = props.id;
    this.electionId = props.electionId;
    this.signature = props.signature;
    this.status = props.status;
    this.pdfS3Key = props.pdfS3Key;
    this.qrCodeData = props.qrCodeData;
    this.layoutMetadata = props.layoutMetadata;
    this.generatedAt = props.generatedAt;
  }

  static create(props: {
    electionId: string;
    signature: BallotSignature;
    qrCodeData: string;
    layoutMetadata: BallotLayout;
    pdfS3Key?: string;
  }): Ballot {
    return new Ballot({
      id: BallotId.create(),
      electionId: props.electionId,
      signature: props.signature,
      status: BALLOT_STATUSES.PENDING,
      pdfS3Key: props.pdfS3Key,
      qrCodeData: props.qrCodeData,
      layoutMetadata: props.layoutMetadata,
      generatedAt: new Date()
    }).finishInitialization();
  }

  static rehydrate(props: {
    id: string;
    electionId: string;
    signature: BallotSignature;
    status: BallotStatus;
    pdfS3Key?: string;
    qrCodeData: string;
    layoutMetadata: BallotLayout;
    generatedAt: string;
    createdAt: string;
    updatedAt: string;
  }): Ballot {
    const ballot = new Ballot(
      {
        id: BallotId.rehydrate(props.id),
        electionId: props.electionId,
        signature: props.signature,
        status: props.status,
        pdfS3Key: props.pdfS3Key,
        qrCodeData: props.qrCodeData,
        layoutMetadata: props.layoutMetadata,
        generatedAt: new Date(props.generatedAt)
      },
      false
    );
    ballot.createdAt = new Date(props.createdAt);
    ballot.updatedAt = new Date(props.updatedAt);
    return ballot.finishInitialization();
  }

  markAsVoted() {
    this.status = BALLOT_STATUSES.VOTED;
  }

  isPending(): boolean {
    return this.status === BALLOT_STATUSES.PENDING;
  }

  isVoted(): boolean {
    return this.status === BALLOT_STATUSES.VOTED;
  }
}
