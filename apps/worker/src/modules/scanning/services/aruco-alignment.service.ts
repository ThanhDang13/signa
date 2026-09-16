import { Injectable, Logger } from "@nestjs/common";
import aruco, { type Detector, type Marker } from "js-aruco2/src/aruco.js";
import type { BallotLayout } from "@signa/shared";
import sharp from "sharp";
import { OpenCvService, type CvMat } from "./opencv.service";

const AR = aruco.AR;

export interface AlignmentResult {
  alignedImage: CvMat | null;
  markersDetected: boolean;
}

/**
 * Service for detecting ArUco markers and performing perspective correction
 * Uses js-aruco2 for marker detection and OpenCV.js for transformation
 */
@Injectable()
export class ArucoAlignmentService {
  private readonly logger = new Logger(ArucoAlignmentService.name);
  private readonly arucoDetector: Detector;

  constructor(private readonly openCvService: OpenCvService) {
    // Initialize ArUco detector with ARUCO dictionary (supports IDs 0-1023)
    this.arucoDetector = new AR.Detector({
      dictionaryName: "ARUCO"
    });
  }

  /**
   * Detect ArUco markers and apply perspective correction to align ballot
   * @param rgbaBuffer - Raw RGBA image buffer
   * @param width - Image width
   * @param height - Image height
   * @param layout - Expected ballot layout with marker positions
   * @returns Aligned grayscale image and detection status
   */
  async align(
    rgbaBuffer: Buffer,
    width: number,
    height: number,
    layout: BallotLayout
  ): Promise<AlignmentResult> {
    try {
      // Create ImageData-like object for ArUco detector
      const imageData = {
        width,
        height,
        data: new Uint8ClampedArray(rgbaBuffer)
      };

      this.logger.debug(
        `ArUco detection: image ${width}x${height}, buffer length ${rgbaBuffer.length}, expected ${width * height * 4}`
      );

      // Validate ImageData format
      if (rgbaBuffer.length !== width * height * 4) {
        this.logger.error(`Buffer size mismatch! Cannot perform detection.`);
        return { alignedImage: null, markersDetected: false };
      }

      // Detect ArUco markers using js-aruco2
      this.logger.debug("Starting ArUco marker detection...");
      const markers = this.arucoDetector.detect(imageData);
      this.logger.debug(`ArUco detection complete: found ${markers.length} markers`);

      if (markers.length > 0) {
        this.logger.debug(`Marker IDs found: ${markers.map(m => m.id).join(", ")}`);
      }

      if (markers.length < 4) {
        this.logger.warn(`Only detected ${markers.length} ArUco markers, need 4 for alignment`);
        return { alignedImage: null, markersDetected: false };
      }

      this.logger.debug(`Detected ${markers.length} ArUco markers`);

      // Map markers by ID - expecting IDs 0, 1, 2, 3 at the four corners
      // 0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left
      const markerMap = this.buildMarkerMap(markers);

      // Validate we have all 4 required markers
      if (!this.hasAllRequiredMarkers(markerMap)) {
        this.logger.warn("Missing required marker IDs (0, 1, 2, 3), skipping alignment");
        return { alignedImage: null, markersDetected: false };
      }

      // Apply perspective transformation
      const alignedImage = this.applyPerspectiveCorrection(
        rgbaBuffer,
        width,
        height,
        markerMap,
        layout
      );

      this.logger.log(`Perspective correction applied: ${alignedImage.cols}x${alignedImage.rows}px`);

      return { alignedImage, markersDetected: true };
    } catch (error) {
      this.logger.error("ArUco detection failed:", error);
      return { alignedImage: null, markersDetected: false };
    }
  }

  /**
   * Build a map of marker IDs to their center positions
   */
  private buildMarkerMap(markers: Marker[]): Map<number, { x: number; y: number }> {
    const markerMap = new Map<number, { x: number; y: number }>();

    for (const marker of markers) {
      if (marker.id >= 0 && marker.id <= 3) {
        // Calculate center of marker from corners
        const centerX = marker.corners.reduce((sum: number, c) => sum + c.x, 0) / marker.corners.length;
        const centerY = marker.corners.reduce((sum: number, c) => sum + c.y, 0) / marker.corners.length;

        markerMap.set(marker.id, { x: centerX, y: centerY });
        this.logger.debug(`Marker ${marker.id} at (${centerX.toFixed(1)}, ${centerY.toFixed(1)})`);
      }
    }

    return markerMap;
  }

  /**
   * Check if all 4 required corner markers are present
   */
  private hasAllRequiredMarkers(markerMap: Map<number, { x: number; y: number }>): boolean {
    return markerMap.has(0) && markerMap.has(1) && markerMap.has(2) && markerMap.has(3);
  }

  /**
   * Apply perspective transformation to align the ballot image
   */
  private applyPerspectiveCorrection(
    rgbaBuffer: Buffer,
    width: number,
    height: number,
    markerMap: Map<number, { x: number; y: number }>,
    layout: BallotLayout
  ): CvMat {
    // Get the initialized OpenCV instance
    const cv = this.openCvService.getCv();

    // Convert RGBA buffer to OpenCV Mat
    const srcMat = new cv.Mat(height, width, cv.CV_8UC4);
    srcMat.data.set(new Uint8Array(rgbaBuffer));

    // Convert to grayscale for processing
    const grayMat = new cv.Mat();
    cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);

    // Source points: detected marker positions
    const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      markerMap.get(0)!.x,
      markerMap.get(0)!.y, // top-left
      markerMap.get(1)!.x,
      markerMap.get(1)!.y, // top-right
      markerMap.get(2)!.x,
      markerMap.get(2)!.y, // bottom-right
      markerMap.get(3)!.x,
      markerMap.get(3)!.y // bottom-left
    ]);

    // Destination points: expected positions based on layout (convert mm to pixels at 300 DPI)
    const mmToPixels = 300 / 25.4; // 300 DPI conversion factor
    const pageWidthPx = Math.round(layout.pageWidth * mmToPixels);
    const pageHeightPx = Math.round(layout.pageHeight * mmToPixels);

    // CRITICAL: The layout stores marker top-left corners, but detection gives us marker centers.
    // We must convert layout coordinates to centers for correct perspective transformation.
    // Marker size is 20mm, so center offset is 10mm from top-left corner.
    const markerSizeMm = 20;
    const markerCenterOffsetMm = markerSizeMm / 2;
    const markerCenterOffsetPx = markerCenterOffsetMm * mmToPixels;

    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      layout.markers.topLeft.x * mmToPixels + markerCenterOffsetPx,
      layout.markers.topLeft.y * mmToPixels + markerCenterOffsetPx,
      layout.markers.topRight.x * mmToPixels + markerCenterOffsetPx,
      layout.markers.topRight.y * mmToPixels + markerCenterOffsetPx,
      layout.markers.bottomRight.x * mmToPixels + markerCenterOffsetPx,
      layout.markers.bottomRight.y * mmToPixels + markerCenterOffsetPx,
      layout.markers.bottomLeft.x * mmToPixels + markerCenterOffsetPx,
      layout.markers.bottomLeft.y * mmToPixels + markerCenterOffsetPx
    ]);

    // Calculate perspective transformation matrix
    const transformMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);

    // Apply perspective warp to grayscale image
    const alignedMat = new cv.Mat();
    const dsize = new cv.Size(pageWidthPx, pageHeightPx);
    cv.warpPerspective(grayMat, alignedMat, transformMatrix, dsize);

    // Clean up temporary matrices
    srcMat.delete();
    grayMat.delete();
    srcPoints.delete();
    dstPoints.delete();
    transformMatrix.delete();

    return alignedMat;
  }
}
