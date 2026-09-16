import { ElectionId } from "@signa/api/modules/election/domain/value-objects";
import { BaseEntity, Accessor } from "@signa/nest-property";
import type { ElectionStatus, FormStructure } from "@signa/shared";
import { ELECTION_STATUSES } from "@signa/shared";
import { createInvalidElectionStatusError } from "@signa/api/modules/election/application/errors";

export class Election extends BaseEntity {
  @Accessor({ readonly: true })
  public readonly id!: ElectionId;

  @Accessor({ touchOnSet: true })
  public title!: string;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public description?: string;

  @Accessor({ touchOnSet: true })
  public formStructure!: FormStructure;

  @Accessor({ touchOnSet: true })
  public status!: ElectionStatus;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public startDate?: Date;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public endDate?: Date;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public maxVoters?: number;

  @Accessor({ readonly: true })
  public readonly createdById!: string;

  private constructor(
    props: {
      id: ElectionId;
      title: string;
      description?: string;
      formStructure: FormStructure;
      status: ElectionStatus;
      startDate?: Date;
      endDate?: Date;
      maxVoters?: number;
      createdById: string;
    },
    isNew = true
  ) {
    super(isNew);
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.formStructure = props.formStructure;
    this.status = props.status;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.maxVoters = props.maxVoters;
    this.createdById = props.createdById;
  }

  static create(props: {
    title: string;
    description?: string;
    formStructure: FormStructure;
    startDate?: Date;
    endDate?: Date;
    maxVoters?: number;
    createdById: string;
  }): Election {
    return new Election({
      id: ElectionId.create(),
      title: props.title,
      description: props.description,
      formStructure: props.formStructure,
      status: ELECTION_STATUSES.DRAFT,
      startDate: props.startDate,
      endDate: props.endDate,
      maxVoters: props.maxVoters,
      createdById: props.createdById
    }).finishInitialization();
  }

  static rehydrate(props: {
    id: string;
    title: string;
    description?: string;
    formStructure: FormStructure;
    status: ElectionStatus;
    startDate?: string;
    endDate?: string;
    maxVoters?: number;
    createdById: string;
    createdAt: string;
    updatedAt: string;
  }): Election {
    const election = new Election(
      {
        id: ElectionId.rehydrate(props.id),
        title: props.title,
        description: props.description,
        formStructure: props.formStructure,
        status: props.status,
        startDate: props.startDate ? new Date(props.startDate) : undefined,
        endDate: props.endDate ? new Date(props.endDate) : undefined,
        maxVoters: props.maxVoters,
        createdById: props.createdById
      },
      false
    );
    election.createdAt = new Date(props.createdAt);
    election.updatedAt = new Date(props.updatedAt);
    return election.finishInitialization();
  }

  updateDetails(title: string, description?: string, formStructure?: FormStructure) {
    this.title = title;
    if (description !== undefined) this.description = description;
    if (formStructure !== undefined) this.formStructure = formStructure;
  }

  updateSchedule(startDate?: Date, endDate?: Date) {
    if (startDate !== undefined) this.startDate = startDate;
    if (endDate !== undefined) this.endDate = endDate;
  }

  activate() {
    if (this.status !== ELECTION_STATUSES.DRAFT) {
      throw createInvalidElectionStatusError();
    }
    this.status = ELECTION_STATUSES.ACTIVE;
  }

  close() {
    if (this.status !== ELECTION_STATUSES.ACTIVE) {
      throw createInvalidElectionStatusError();
    }
    this.status = ELECTION_STATUSES.CLOSED;
  }

  archive() {
    if (this.status !== ELECTION_STATUSES.CLOSED) {
      throw createInvalidElectionStatusError();
    }
    this.status = ELECTION_STATUSES.ARCHIVED;
  }

  isActive(): boolean {
    return this.status === ELECTION_STATUSES.ACTIVE;
  }

  canEdit(): boolean {
    return this.status === ELECTION_STATUSES.DRAFT;
  }
}
