export const ELECTION_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  CLOSED: "closed",
  ARCHIVED: "archived"
} as const;

export const BALLOT_STATUSES = {
  PENDING: "pending",
  VOTED: "voted"
} as const;

export const FIELD_TYPES = {
  CHECKBOX: "checkbox",
  RADIO: "radio",
  TEXT: "text"
} as const;

export const PROCESSING_METHODS = {
  OMR: "omr",
  OCR: "ocr"
} as const;
