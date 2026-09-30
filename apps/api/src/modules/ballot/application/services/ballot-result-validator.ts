import { Injectable, Logger } from "@nestjs/common";
import type { BallotLayout } from "@signa/shared";
import { FIELD_TYPES, PROCESSING_METHODS } from "@signa/shared";
import type {
  ValidationError,
  ValidationStatus,
  ScanSelection
} from "@signa/api/modules/ballot/domain/entities/ballot-scan-result";

// Confidence threshold for mark detection
const CONFIDENCE_THRESHOLD = 0.5;

export type ValidationResult = {
  isValid: boolean;
  status: ValidationStatus;
  errors: ValidationError[];
};

@Injectable()
export class BallotResultValidator {
  private readonly logger = new Logger(BallotResultValidator.name);

  /**
   * Validate scan results against the ballot's immutable layout
   */
  validate(
    qrVerified: boolean,
    selections: ScanSelection[],
    layout: BallotLayout,
    processingMetadata?: { markersDetected: boolean; alignmentApplied: boolean }
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // 1. Aruco markers must be detected (happens before QR verification)
    if (processingMetadata && !processingMetadata.markersDetected) {
      return {
        isValid: false,
        status: "invalid_markers",
        errors: [{ reason: "Aruco markers not detected" }]
      };
    }

    // 2. QR must be verified
    if (!qrVerified) {
      return {
        isValid: false,
        status: "invalid_qr",
        errors: [{ reason: "QR code verification failed" }]
      };
    }

    // 2. Build field lookup map
    const fieldMap = new Map(layout.fields.map((f) => [f.id, f]));

    // 3. Check for unknown field IDs in selections
    const selectedFieldIds = selections.map((s) => s.fieldId);
    const unknownFields = selectedFieldIds.filter((id) => !fieldMap.has(id));
    if (unknownFields.length > 0) {
      errors.push({
        reason: `Unknown field IDs in selections: ${unknownFields.join(", ")}`
      });
    }

    // 4. Check each result field
    const selectionMap = new Map(selections.map((s) => [s.fieldId, s]));

    for (const field of layout.fields) {
      const selection = selectionMap.get(field.id);
      const fieldType = field.type;
      const fieldMethod = field.method;
      const isRequired = field.required ?? false;

      // 4a. Reject unsupported OCR/text fields
      if (fieldMethod === PROCESSING_METHODS.OCR || fieldType === FIELD_TYPES.TEXT) {
        if (selection && selection.selectedValues.length > 0) {
          errors.push({
            fieldId: field.id,
            reason: `Field type '${fieldType}' with method '${fieldMethod}' is not yet supported`
          });
        }
        continue;
      }

      // 4b. Check required fields have a selection
      if (isRequired) {
        if (!selection || selection.selectedValues.length === 0) {
          errors.push({
            fieldId: field.id,
            reason: `Required field '${field.label}' has no selection`
          });
          continue;
        }
      }

      // If no selection for this field, and it's not required, that's valid
      if (!selection || selection.selectedValues.length === 0) {
        continue;
      }

      // 4c. Check confidence threshold
      if (selection.confidence < CONFIDENCE_THRESHOLD) {
        errors.push({
          fieldId: field.id,
          reason: `Selection confidence ${selection.confidence.toFixed(2)} below threshold ${CONFIDENCE_THRESHOLD}`
        });
        continue;
      }

      // 4d. Validate selected values are in allowed options
      const allowedValues = new Set(field.options.map((opt) => opt.value));
      const invalidValues = selection.selectedValues.filter((v) => !allowedValues.has(v));
      if (invalidValues.length > 0) {
        errors.push({
          fieldId: field.id,
          reason: `Invalid option values: ${invalidValues.join(", ")}`
        });
      }

      // 4e. Radio fields must have exactly one selection
      if (fieldType === FIELD_TYPES.RADIO && selection.selectedValues.length > 1) {
        errors.push({
          fieldId: field.id,
          reason: `Radio field '${field.label}' has multiple selections (${selection.selectedValues.length})`
        });
      }
    }

    // 5. Check for duplicate field IDs in selections
    const duplicateFields = selectedFieldIds.filter(
      (id, index) => selectedFieldIds.indexOf(id) !== index
    );
    if (duplicateFields.length > 0) {
      errors.push({
        reason: `Duplicate field IDs in selections: ${[...new Set(duplicateFields)].join(", ")}`
      });
    }

    // Determine final status
    if (errors.length > 0) {
      // Classify error type
      const hasConfidenceError = errors.some((e) => e.reason.includes("confidence"));
      if (hasConfidenceError) {
        return { isValid: false, status: "invalid_confidence", errors };
      }
      return { isValid: false, status: "invalid_selections", errors };
    }

    return { isValid: true, status: "valid", errors: [] };
  }
}
