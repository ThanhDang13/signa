import { Injectable, Logger } from "@nestjs/common";
import type { FormStructure, BallotLayout } from "@signa/shared";
import PDFDocument from "pdfkit";
import { ArucoMarkerDrawingService } from "./aruco-marker-drawing.service";
import { FormFieldRenderingService } from "./form-field-rendering.service";
import { registerBallotFonts, BALLOT_FONT_REGULAR, BALLOT_FONT_BOLD, nfc } from "./ballot-fonts";

export interface PdfGenerationResult {
  pdfBuffer: Buffer;
  layout: BallotLayout;
}

export interface BatchPdfGenerationResult {
  pdfBuffer: Buffer;
  ballots: Array<{
    ballotId: string;
    layout: BallotLayout;
    pageNumber: number;
  }>;
}

/**
 * Service for generating PDF ballots with ArUco markers and form fields
 */
@Injectable()
export class BallotPdfGenerationService {
  private readonly logger = new Logger(BallotPdfGenerationService.name);

  // A4 dimensions in points (72 DPI)
  private readonly PAGE_WIDTH = 595.28;
  private readonly PAGE_HEIGHT = 841.89;

  // ArUco marker IDs for the 4 corners
  // IDs match scanning expectations: 0=topLeft, 1=topRight, 2=bottomRight, 3=bottomLeft
  private readonly MARKER_IDS = {
    TOP_LEFT: 0,
    TOP_RIGHT: 1,
    BOTTOM_RIGHT: 2,
    BOTTOM_LEFT: 3
  };

  constructor(
    private readonly markerDrawingService: ArucoMarkerDrawingService,
    private readonly formFieldService: FormFieldRenderingService
  ) {}

  /**
   * Generate a batch of PDF ballots with form fields, ArUco markers, and QR codes
   * @param formStructure - Form definition with fields and layout
   * @param ballots - Array of ballot IDs and their QR code data URLs
   * @returns PDF buffer and metadata for each ballot with page numbers
   */
  async generateBatch(
    formStructure: FormStructure,
    ballots: Array<{ ballotId: string; qrCodeDataUrl: string }>
  ): Promise<BatchPdfGenerationResult> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
          size: "A4",
          margins: {
            top: this.formFieldService.mmToPoints(formStructure.layout.margins.top),
            right: this.formFieldService.mmToPoints(formStructure.layout.margins.right),
            bottom: this.formFieldService.mmToPoints(formStructure.layout.margins.bottom),
            left: this.formFieldService.mmToPoints(formStructure.layout.margins.left)
          }
        });

        // Register custom fonts before any drawing operations
        registerBallotFonts(doc);

      // Track layout metadata for OMR processing (convert points to millimeters)
      const markerSize = this.markerDrawingService.getMarkerSize();
      const markerOffset = 20; // Increased offset for proper quiet zone
      const qrSize = 85; // Balanced size for reliable scanning (30mm ~= 350px at 300 DPI)

      // Position QR code directly below top-right ArUco marker
      const topRightMarkerX = this.PAGE_WIDTH - markerSize - markerOffset;
      const qrX = topRightMarkerX + markerSize - qrSize; // Align right edge with marker
      const qrY = markerOffset + markerSize + 10; // 10pt gap below marker

      const layout: BallotLayout = {
        pageWidth: this.formFieldService.pointsToMm(this.PAGE_WIDTH),
        pageHeight: this.formFieldService.pointsToMm(this.PAGE_HEIGHT),
        markers: {
          topLeft: {
            x: this.formFieldService.pointsToMm(markerOffset),
            y: this.formFieldService.pointsToMm(markerOffset)
          },
          topRight: {
            x: this.formFieldService.pointsToMm(topRightMarkerX),
            y: this.formFieldService.pointsToMm(markerOffset)
          },
          bottomLeft: {
            x: this.formFieldService.pointsToMm(markerOffset),
            y: this.formFieldService.pointsToMm(this.PAGE_HEIGHT - markerSize - markerOffset)
          },
          bottomRight: {
            x: this.formFieldService.pointsToMm(this.PAGE_WIDTH - markerSize - markerOffset),
            y: this.formFieldService.pointsToMm(this.PAGE_HEIGHT - markerSize - markerOffset)
          }
        },
        qrCode: {
          x: this.formFieldService.pointsToMm(qrX),
          y: this.formFieldService.pointsToMm(qrY),
          width: this.formFieldService.pointsToMm(qrSize),
          height: this.formFieldService.pointsToMm(qrSize)
        },
        fields: []
      };

      const result: BatchPdfGenerationResult = {
        pdfBuffer: Buffer.alloc(0),
        ballots: []
      };

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        result.pdfBuffer = Buffer.concat(chunks);
        resolve(result);
      });
      doc.on("error", reject);

      // Generate each ballot as a page
      ballots.forEach(({ ballotId, qrCodeDataUrl }, index) => {
        try {
          // Add new page for subsequent ballots
          if (index > 0) {
            doc.addPage();
          }

        // FIRST: Draw title and description at the top (before markers/QR)
        // This ensures they're positioned correctly at the page top
        doc.fontSize(28).font(BALLOT_FONT_BOLD).text(nfc(formStructure.title), {
          align: "center"
        });
        doc.moveDown(0.5);

        // Draw description if present
        if (formStructure.description) {
          doc.fontSize(14).font(BALLOT_FONT_REGULAR).text(nfc(formStructure.description), {
            align: "center"
          });
          doc.moveDown();
        }

        // Save the Y position after title/description for content to start
        doc.moveDown(1.5);

        // THEN: Draw ArUco markers at corners (these are positioned absolutely)
        this.markerDrawingService.drawMarkers(doc, [
          { id: this.MARKER_IDS.TOP_LEFT, x: markerOffset, y: markerOffset },
          { id: this.MARKER_IDS.TOP_RIGHT, x: topRightMarkerX, y: markerOffset },
          { id: this.MARKER_IDS.BOTTOM_LEFT, x: markerOffset, y: this.PAGE_HEIGHT - markerSize - markerOffset },
          {
            id: this.MARKER_IDS.BOTTOM_RIGHT,
            x: this.PAGE_WIDTH - markerSize - markerOffset,
            y: this.PAGE_HEIGHT - markerSize - markerOffset
          }
        ]);

        // Draw QR code (positioned absolutely, won't affect text flow)
        doc.image(qrCodeDataUrl, qrX, qrY, {
          width: qrSize,
          height: qrSize
        });

        // Draw form fields and collect OMR positions
        // Reset fields array for each ballot
        const ballotLayout = { ...layout, fields: [] };
        this.formFieldService.drawFormFields(doc, formStructure.fields, ballotLayout.fields);

          // Store metadata for this ballot
          result.ballots.push({
            ballotId,
            layout: ballotLayout,
            pageNumber: index + 1
          });
        } catch (error) {
          this.logger.error(`Error generating ballot ${ballotId}:`, error);
          reject(error);
        }
      });

      doc.end();
    } catch (error) {
      this.logger.error("Error in generateBatch:", error);
      reject(error);
    }
    });
  }

  /**
   * Generate a PDF ballot with form fields, ArUco markers, and QR code (single ballot)
   * @param formStructure - Form definition with fields and layout
   * @param ballotId - Unique ballot identifier
   * @param qrCodeDataUrl - QR code as base64 data URL
   * @returns PDF buffer and layout metadata with OMR coordinates
   * @deprecated Use generateBatch instead, even for single ballots
   */
  async generate(
    formStructure: FormStructure,
    ballotId: string,
    qrCodeDataUrl: string
  ): Promise<PdfGenerationResult> {
    // Delegate to generateBatch with a single ballot
    const batchResult = await this.generateBatch(formStructure, [{ ballotId, qrCodeDataUrl }]);

    return {
      pdfBuffer: batchResult.pdfBuffer,
      layout: batchResult.ballots[0].layout
    };
  }
}
