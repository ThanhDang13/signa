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

interface MarkScore {
  isMarked: boolean;
  confidence: number;
  darkCoverage: number;
  largestComponentCoverage: number;
  connectedDarkRatio: number;
  centerCoverage: number;
  threshold: number;
}

/**
 * Service for detecting marks in ballot checkboxes using pixel density analysis
 * Industry standard approach used by systems like Scantron
 */
@Injectable()
export class MarkDetectionService {
  private readonly logger = new Logger(MarkDetectionService.name);

  // A 300 DPI scan of the 12pt checkbox is approximately 50px wide.
  private readonly MM_TO_PIXELS = 300 / 25.4;

  // Keep enough of the interior to detect a partial pen tick without counting
  // the printed checkbox/radio border as a mark.
  private readonly BORDER_INSET_RATIO = 0.1;

  // Adaptive darkness settings. The threshold is derived from the local paper
  // brightness so scans with different exposure levels behave consistently.
  private readonly BACKGROUND_PERCENTILE = 0.85;
  private readonly MIN_DARKNESS = 24;
  private readonly DARKNESS_RATIO = 0.15;
  private readonly MIN_PIXEL_THRESHOLD = 100;
  private readonly MAX_PIXEL_THRESHOLD = 220;

  // A mark may be a partial handwritten stroke, but isolated scan noise should
  // not be enough to select an option.
  private readonly MIN_MARK_COVERAGE = 0.05;
  private readonly MIN_COMPONENT_COVERAGE = 0.03;
  private readonly MIN_COMPONENT_PIXELS = 10;
  private readonly MIN_CONNECTED_DARK_RATIO = 0.55;
  private readonly STRONG_COVERAGE = 0.3;
  private readonly STRONG_COMPONENT_COVERAGE = 0.2;
  private readonly CENTER_REGION_RATIO = 0.4;
  // Require a small amount of ink in the central 40% of the ROI to guard precision.
  private readonly MIN_CENTER_COVERAGE = 0.13;

  /**
   * Detect marks at checkbox/radio positions using adaptive pixel analysis.
   *
   * The detector uses local paper brightness and connected components instead
   * of one global dark-pixel threshold. This makes light, partial pen marks
   * detectable while rejecting isolated scanner noise and printed borders.
   *
   * @param imageData - Grayscale image data buffer
   * @param width - Image width in pixels
   * @param height - Image height in pixels
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
      const selectedValues: string[] = [];
      let totalConfidence = 0;
      let checkedCount = 0;

      for (const option of field.options) {
        try {
          const score = this.calculateMarkScore(
            imageData,
            width,
            height,
            option.omr.x,
            option.omr.y,
            option.omr.width,
            option.omr.height
          );

          if (score.isMarked) {
            selectedValues.push(option.value);
            totalConfidence += score.confidence;
            checkedCount++;
          }

          this.logger.debug(
            `Field ${field.id}, option ${option.value}: ` +
              `coverage=${(score.darkCoverage * 100).toFixed(1)}%, ` +
              `component=${(score.largestComponentCoverage * 100).toFixed(1)}%, ` +
              `connected=${(score.connectedDarkRatio * 100).toFixed(1)}%, ` +
              `center=${(score.centerCoverage * 100).toFixed(1)}%, ` +
              `threshold=${score.threshold.toFixed(0)}, ` +
              `confidence=${(score.confidence * 100).toFixed(1)}%, ` +
              `checked=${score.isMarked}`
          );
        } catch (error) {
          this.logger.error(`Failed to analyze checkbox at ${option.omr.x},${option.omr.y}:`, error);
        }
      }

      const avgConfidence = checkedCount > 0 ? totalConfidence / checkedCount : 0;

      selections.push({
        fieldId: field.id,
        selectedValues,
        confidence: avgConfidence
      });

      this.logger.log(
        `Field ${field.id}: ${selectedValues.length} selections, confidence: ${(avgConfidence * 100).toFixed(1)}%`
      );
    }

    return selections;
  }

  /**
   * Score one checkbox/radio ROI.
   */
  private calculateMarkScore(
    imageData: Buffer,
    imageWidth: number,
    imageHeight: number,
    x: number,
    y: number,
    boxWidth: number,
    boxHeight: number
  ): MarkScore {
    const emptyScore: MarkScore = {
      isMarked: false,
      confidence: 0,
      darkCoverage: 0,
      largestComponentCoverage: 0,
      connectedDarkRatio: 0,
      centerCoverage: 0,
      threshold: this.MAX_PIXEL_THRESHOLD
    };

    const pixelX = Math.round(x * this.MM_TO_PIXELS);
    const pixelY = Math.round(y * this.MM_TO_PIXELS);
    const pixelWidth = Math.round(boxWidth * this.MM_TO_PIXELS);
    const pixelHeight = Math.round(boxHeight * this.MM_TO_PIXELS);

    const insetX = Math.max(1, Math.round(pixelWidth * this.BORDER_INSET_RATIO));
    const insetY = Math.max(1, Math.round(pixelHeight * this.BORDER_INSET_RATIO));

    const startX = Math.max(0, pixelX + insetX);
    const startY = Math.max(0, pixelY + insetY);
    const endX = Math.min(imageWidth, pixelX + pixelWidth - insetX);
    const endY = Math.min(imageHeight, pixelY + pixelHeight - insetY);
    const roiWidth = endX - startX;
    const roiHeight = endY - startY;

    if (
      roiWidth <= 0 ||
      roiHeight <= 0 ||
      imageData.length < imageWidth * imageHeight
    ) {
      return emptyScore;
    }

    const roiSize = roiWidth * roiHeight;
    const pixels = new Uint8Array(roiSize);

    for (let row = 0; row < roiHeight; row++) {
      const sourceStart = (startY + row) * imageWidth + startX;
      const destinationStart = row * roiWidth;
      pixels.set(imageData.subarray(sourceStart, sourceStart + roiWidth), destinationStart);
    }

    const background = this.percentile(pixels, this.BACKGROUND_PERCENTILE);
    const darkness = Math.max(this.MIN_DARKNESS, background * this.DARKNESS_RATIO);
    const threshold = Math.max(
      this.MIN_PIXEL_THRESHOLD,
      Math.min(this.MAX_PIXEL_THRESHOLD, background - darkness)
    );
    const mask = new Uint8Array(roiSize);

    let darkPixels = 0;
    let centerDarkPixels = 0;
    let centerPixels = 0;
    const centerStartX = roiWidth * ((1 - this.CENTER_REGION_RATIO) / 2);
    const centerEndX = roiWidth - centerStartX;
    const centerStartY = roiHeight * ((1 - this.CENTER_REGION_RATIO) / 2);
    const centerEndY = roiHeight - centerStartY;

    for (let row = 0; row < roiHeight; row++) {
      for (let column = 0; column < roiWidth; column++) {
        const index = row * roiWidth + column;
        const inCenter =
          column >= centerStartX &&
          column < centerEndX &&
          row >= centerStartY &&
          row < centerEndY;

        if (inCenter) centerPixels++;

        if (pixels[index] <= threshold) {
          mask[index] = 1;
          darkPixels++;
          if (inCenter) centerDarkPixels++;
        }
      }
    }

    if (darkPixels === 0) {
      return { ...emptyScore, threshold };
    }

    const largestComponent = this.findLargestComponent(mask, roiWidth, roiHeight);
    const darkCoverage = darkPixels / roiSize;
    const largestComponentCoverage = largestComponent / roiSize;
    const connectedDarkRatio = largestComponent / darkPixels;
    const centerCoverage = centerPixels > 0 ? centerDarkPixels / centerPixels : 0;

    // A connected component is the important guard against isolated noise.
    // The lower coverage threshold intentionally admits partial handwritten ticks.
    const isMarked =
      darkCoverage >= this.MIN_MARK_COVERAGE &&
      largestComponent >= this.MIN_COMPONENT_PIXELS &&
      largestComponentCoverage >= this.MIN_COMPONENT_COVERAGE &&
      connectedDarkRatio >= this.MIN_CONNECTED_DARK_RATIO &&
      centerCoverage >= this.MIN_CENTER_COVERAGE;

    const coverageSignal = this.normalize(darkCoverage, this.MIN_MARK_COVERAGE, this.STRONG_COVERAGE);
    const componentSignal = this.normalize(
      largestComponentCoverage,
      this.MIN_COMPONENT_COVERAGE,
      this.STRONG_COMPONENT_COVERAGE
    );
    const centerSignal = this.normalize(centerCoverage, 0.02, 0.2);
    const confidence = isMarked
      ? Math.min(1, coverageSignal * 0.45 + componentSignal * 0.4 + centerSignal * 0.15)
      : 0;

    return {
      isMarked,
      confidence,
      darkCoverage,
      largestComponentCoverage,
      connectedDarkRatio,
      centerCoverage,
      threshold
    };
  }

  /**
   * Return the largest 8-connected component in a binary ROI mask.
   */
  private findLargestComponent(mask: Uint8Array, width: number, height: number): number {
    const visited = new Uint8Array(mask.length);
    const stack: number[] = [];
    let largest = 0;

    for (let index = 0; index < mask.length; index++) {
      if (mask[index] === 0 || visited[index] !== 0) continue;

      visited[index] = 1;
      stack.push(index);
      let componentSize = 0;

      while (stack.length > 0) {
        const current = stack.pop()!;
        componentSize++;

        const row = Math.floor(current / width);
        const column = current % width;

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
          for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
            if (rowOffset === 0 && columnOffset === 0) continue;

            const neighborRow = row + rowOffset;
            const neighborColumn = column + columnOffset;
            if (
              neighborRow < 0 ||
              neighborRow >= height ||
              neighborColumn < 0 ||
              neighborColumn >= width
            ) {
              continue;
            }

            const neighbor = neighborRow * width + neighborColumn;
            if (mask[neighbor] !== 0 && visited[neighbor] === 0) {
              visited[neighbor] = 1;
              stack.push(neighbor);
            }
          }
        }
      }

      largest = Math.max(largest, componentSize);
    }

    return largest;
  }

  private percentile(values: Uint8Array, percentile: number): number {
    const sorted = Array.from(values).sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * percentile));
    return sorted[index] ?? 255;
  }

  private normalize(value: number, minimum: number, maximum: number): number {
    if (value <= minimum) return 0;
    if (value >= maximum) return 1;
    return (value - minimum) / (maximum - minimum);
  }
}
