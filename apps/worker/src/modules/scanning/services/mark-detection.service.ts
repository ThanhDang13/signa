import { Injectable, Logger } from "@nestjs/common";

export interface FieldLayout {
  id: string;
  options: Array<{
    value: string;
    omr: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface MarkDetectionResult {
  fieldId: string;
  selectedValues: string[];
  confidence: number;
}

/**
 * Service for detecting marks in ballot checkboxes using pixel density analysis
 * Industry standard approach used by systems like Scantron
 */
@Injectable()
export class MarkDetectionService {
  private readonly logger = new Logger(MarkDetectionService.name);

  // OMR detection thresholds
  private readonly FILL_THRESHOLD = 0.3; // 30% dark pixels = marked
  private readonly DARK_PIXEL_THRESHOLD = 128; // Pixel values below this are "dark"
  private readonly BORDER_INSET_RATIO = 0.15; // Inset 15% from each edge to avoid borders

  /**
   * Detect marks at checkbox/radio positions using pixel density analysis
   * @param imageData - Grayscale image data buffer
   * @param width - Image width
   * @param height - Image height
   * @param fields - Field layout with OMR coordinates
   * @returns Array of field selections with confidence scores
   */
  async detect(
    imageData: Buffer,
    width: number,
    height: number,
    fields: FieldLayout[]
  ): Promise<MarkDetectionResult[]> {
    const selections: MarkDetectionResult[] = [];

    for (const field of fields) {
      const fieldId = field.id;
      const selectedValues: string[] = [];
      let totalConfidence = 0;
      let checkedCount = 0;

      for (const option of field.options) {
        const { x, y, width: boxWidth, height: boxHeight } = option.omr;

        try {
          // Calculate fill percentage for the checkbox region
          const fillPercentage = this.calculateFillPercentage(
            imageData,
            width,
            height,
            Math.floor(x),
            Math.floor(y),
            Math.floor(boxWidth),
            Math.floor(boxHeight)
          );

          const isChecked = fillPercentage > this.FILL_THRESHOLD;

          if (isChecked) {
            selectedValues.push(option.value);
            totalConfidence += fillPercentage;
            checkedCount++;
          }

          this.logger.debug(
            `Field ${fieldId}, option ${option.value}: fill=${(fillPercentage * 100).toFixed(1)}%, checked=${isChecked}`
          );
        } catch (error) {
          this.logger.error(`Failed to analyze checkbox at ${x},${y}:`, error);
        }
      }

      // Calculate average confidence for this field
      const avgConfidence = checkedCount > 0 ? totalConfidence / checkedCount : 0;

      selections.push({
        fieldId,
        selectedValues,
        confidence: avgConfidence
      });

      this.logger.log(
        `Field ${fieldId}: ${selectedValues.length} selections, confidence: ${(avgConfidence * 100).toFixed(1)}%`
      );
    }

    return selections;
  }

  /**
   * Calculate how filled a checkbox region is (0.0 to 1.0)
   * Uses pixel density analysis - simple, fast, and reliable for controlled forms
   *
   * IMPORTANT: Insets from the edges to exclude checkbox borders which would
   * otherwise be counted as "dark pixels" and cause false positives.
   */
  private calculateFillPercentage(
    imageData: Buffer,
    imageWidth: number,
    imageHeight: number,
    x: number,
    y: number,
    boxWidth: number,
    boxHeight: number
  ): number {
    try {
      // Convert mm to pixels for the coordinates
      const mmToPixels = 300 / 25.4; // 300 DPI conversion
      const pixelX = Math.round(x * mmToPixels);
      const pixelY = Math.round(y * mmToPixels);
      const pixelWidth = Math.round(boxWidth * mmToPixels);
      const pixelHeight = Math.round(boxHeight * mmToPixels);

      // Apply inset to exclude checkbox borders
      // This prevents border pixels from being counted as "marks"
      const insetX = Math.round(pixelWidth * this.BORDER_INSET_RATIO);
      const insetY = Math.round(pixelHeight * this.BORDER_INSET_RATIO);

      const scanX = pixelX + insetX;
      const scanY = pixelY + insetY;
      const scanWidth = pixelWidth - (2 * insetX);
      const scanHeight = pixelHeight - (2 * insetY);

      // Ensure we have a valid region to scan
      if (scanWidth <= 0 || scanHeight <= 0) {
        this.logger.warn(`Invalid scan region after inset: ${scanWidth}x${scanHeight}`);
        return 0;
      }

      let darkPixelCount = 0;
      let totalPixels = 0;

      // Scan the checkbox interior region (excluding borders)
      for (let py = scanY; py < scanY + scanHeight && py < imageHeight; py++) {
        for (let px = scanX; px < scanX + scanWidth && px < imageWidth; px++) {
          const idx = py * imageWidth + px;
          if (idx >= 0 && idx < imageData.length) {
            const pixelValue = imageData[idx];
            // Consider pixels darker than threshold as "filled"
            if (pixelValue < this.DARK_PIXEL_THRESHOLD) {
              darkPixelCount++;
            }
            totalPixels++;
          }
        }
      }

      if (totalPixels === 0) return 0;

      const fillRatio = darkPixelCount / totalPixels;
      return fillRatio;
    } catch (error) {
      this.logger.error("Fill percentage calculation failed:", error);
      return 0;
    }
  }
}
