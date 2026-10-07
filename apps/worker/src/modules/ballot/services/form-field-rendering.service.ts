import { Injectable } from "@nestjs/common";
import type { FormField, BallotLayout } from "@signa/shared";
import type PDFDocument from "pdfkit";
import { BALLOT_FONT_REGULAR, BALLOT_FONT_BOLD, nfc } from "./ballot-fonts";

/**
 * Service for rendering form fields on PDF ballots
 * Tracks OMR coordinates for later scanning
 */
@Injectable()
export class FormFieldRenderingService {
  /**
   * Draw form fields on a PDF document and collect OMR layout metadata
   * @param doc - PDFKit document instance
   * @param fields - Form fields to render
   * @param layoutFields - Output array for collecting OMR coordinates
   */
  drawFormFields(
    doc: typeof PDFDocument.prototype,
    fields: FormField[],
    layoutFields: BallotLayout["fields"]
  ): void {
    const leftMargin = doc.page.margins.left;

    fields.forEach((field, index) => {
      if (index > 0) {
        doc.moveDown(1.5);
      }

      const startY = doc.y;

      // Draw required indicator before label
      if (field.required) {
        doc.fillColor("red").fontSize(14).text("* ", leftMargin, startY, { continued: true });
      }

      // Draw field label
      doc.fillColor("black").fontSize(14).font(BALLOT_FONT_BOLD).text(nfc(field.label), leftMargin, startY);
      doc.moveDown(0.3);

      // Track field layout with validation rules for scan result processing
      const fieldLayout: BallotLayout["fields"][0] = {
        id: field.id,
        label: field.label,
        options: [],
        type: field.type,
        required: field.required,
        method: field.method
      };

      // Draw field based on type
      if (field.type === "checkbox" && field.options) {
        this.drawCheckboxField(doc, field.options, leftMargin, fieldLayout);
      } else if (field.type === "radio" && field.options) {
        this.drawRadioField(doc, field.options, leftMargin, fieldLayout);
      } else if (field.type === "text") {
        this.drawTextField(doc, leftMargin);
      }

      // Add field layout to collection
      layoutFields.push(fieldLayout);
    });
  }

  /**
   * Draw checkbox options for a field
   */
  private drawCheckboxField(
    doc: typeof PDFDocument.prototype,
    options: string[],
    leftMargin: number,
    fieldLayout: BallotLayout["fields"][0]
  ): void {
    const checkboxSize = 12;
    const spacing = 5;

    options.forEach((option: string) => {
      const currentY = doc.y;

      // Draw checkbox
      doc.rect(leftMargin, currentY, checkboxSize, checkboxSize).stroke("black");

      // Track checkbox position for OMR (convert PDF points to millimeters)
      fieldLayout.options.push({
        value: option,
        omr: {
          x: this.pointsToMm(leftMargin),
          y: this.pointsToMm(currentY),
          width: this.pointsToMm(checkboxSize),
          height: this.pointsToMm(checkboxSize)
        }
      });

      // Draw option label
      doc.fontSize(12)
        .font(BALLOT_FONT_REGULAR)
        .text(nfc(option), leftMargin + checkboxSize + spacing, currentY);

      doc.moveDown(0.5);
    });
  }

  /**
   * Draw radio button options for a field
   */
  private drawRadioField(
    doc: typeof PDFDocument.prototype,
    options: string[],
    leftMargin: number,
    fieldLayout: BallotLayout["fields"][0]
  ): void {
    const radioSize = 12;
    const spacing = 5;

    options.forEach((option: string) => {
      const currentY = doc.y;

      // Draw radio circle
      doc.circle(leftMargin + radioSize / 2, currentY + radioSize / 2, radioSize / 2).stroke("black");

      // Track radio position for OMR (convert PDF points to millimeters)
      fieldLayout.options.push({
        value: option,
        omr: {
          x: this.pointsToMm(leftMargin),
          y: this.pointsToMm(currentY),
          width: this.pointsToMm(radioSize),
          height: this.pointsToMm(radioSize)
        }
      });

      // Draw option label
      doc.fontSize(12)
        .font(BALLOT_FONT_REGULAR)
        .text(nfc(option), leftMargin + radioSize + spacing, currentY);

      doc.moveDown(0.5);
    });
  }

  /**
   * Draw text input field
   */
  private drawTextField(doc: typeof PDFDocument.prototype, leftMargin: number): void {
    const textBoxHeight = 30;
    const currentY = doc.y;
    const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Draw text input box
    doc.rect(leftMargin, currentY, availableWidth, textBoxHeight).stroke("black");
    doc.moveDown(textBoxHeight / doc.currentLineHeight() + 0.3);
  }

  /**
   * Convert millimeters to points (PDF measurement unit)
   */
  mmToPoints(mm: number): number {
    return mm * 2.83465;
  }

  /**
   * Convert points to millimeters (for OMR layout metadata)
   */
  pointsToMm(points: number): number {
    return points / 2.83465;
  }
}
