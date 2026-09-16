import { Injectable } from "@nestjs/common";
import aruco from "js-aruco2/src/aruco.js";
import type PDFDocument from "pdfkit";

const AR = aruco.AR;

export interface MarkerPosition {
  id: number;
  x: number;
  y: number;
}

/**
 * Service for drawing ArUco markers on PDF documents
 * Uses js-aruco2's built-in SVG generator for guaranteed compatibility
 */
@Injectable()
export class ArucoMarkerDrawingService {
  private readonly MARKER_SIZE = 56.69; // 20mm at 72 DPI (balanced for detection and page proportions)
  private readonly dictionary: typeof AR.Dictionary.prototype;

  constructor() {
    // Use the same dictionary as the detector for guaranteed compatibility
    this.dictionary = new AR.Dictionary("ARUCO");
  }

  /**
   * Parse SVG rectangles from js-aruco2's generateSVG output
   */
  private parseSVGRectangles(svg: string): Array<{ x: number; y: number; width: number; height: number; fill: string }> {
    const rectRegex = /<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" fill="([^"]+)"\/>/g;
    const rectangles: Array<{ x: number; y: number; width: number; height: number; fill: string }> = [];

    let match;
    while ((match = rectRegex.exec(svg)) !== null) {
      rectangles.push({
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
        width: parseFloat(match[3]),
        height: parseFloat(match[4]),
        fill: match[5]
      });
    }

    return rectangles;
  }

  /**
   * Draw ArUco markers at specified positions on a PDF document
   * @param doc - PDFKit document instance
   * @param positions - Array of marker positions with IDs (0-1023 for ARUCO dictionary)
   */
  drawMarkers(doc: typeof PDFDocument.prototype, positions: MarkerPosition[]): void {
    positions.forEach(({ id, x, y }) => {
      // Use js-aruco2's authoritative SVG generator
      const svg = this.dictionary.generateSVG(id);

      // Parse the SVG (viewBox is 0 0 9 9 for ARUCO dictionary)
      const rectangles = this.parseSVGRectangles(svg);

      // Scale factor from SVG coordinates (9x9) to PDF points
      const scale = this.MARKER_SIZE / 9;

      // Draw each rectangle from the SVG
      rectangles.forEach((rect) => {
        doc
          .rect(
            x + rect.x * scale,
            y + rect.y * scale,
            rect.width * scale,
            rect.height * scale
          )
          .fill(rect.fill);
      });
    });
  }

  /**
   * Get the size of ArUco markers in points
   */
  getMarkerSize(): number {
    return this.MARKER_SIZE;
  }
}
