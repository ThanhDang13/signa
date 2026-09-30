import { Injectable, Logger } from "@nestjs/common";
import jsQR from "jsqr";
import { createHmac } from "crypto";
import { inflateSync } from "zlib";
import sharp from "sharp";
import { OpenCvService } from "./opencv.service";

/**
 * Service for QR code verification with HMAC signature validation
 */
@Injectable()
export class QrVerificationService {
  private readonly logger = new Logger(QrVerificationService.name);

  constructor(private readonly openCvService: OpenCvService) {}

  /**
   * Verify QR code in the ballot and validate HMAC signature
   * @param imageData - Grayscale image data buffer (1 byte per pixel) from aligned image
   * @param width - Aligned image width (already at 300 DPI)
   * @param height - Aligned image height (already at 300 DPI)
   * @param expectedBallotId - Expected ballot ID to validate against
   * @param ballotSecret - Secret key for HMAC validation
   * @param qrRegion - QR code region to scan (in millimeters from layout)
   * @returns true if QR code is valid and signature matches
   */
  async verify(
    imageData: Buffer,
    width: number,
    height: number,
    expectedBallotId: string,
    ballotSecret: string,
    qrRegion: { x: number; y: number; width: number; height: number }
  ): Promise<boolean> {
    try {
      // Extract QR region for targeted scanning
      // The aligned image is already at 300 DPI, so convert mm coordinates to pixels
      const mmToPixels = 300 / 25.4;
      const regionX = Math.round(qrRegion.x * mmToPixels);
      const regionY = Math.round(qrRegion.y * mmToPixels);
      const regionWidth = Math.round(qrRegion.width * mmToPixels);
      const regionHeight = Math.round(qrRegion.height * mmToPixels);

      this.logger.debug(
        `Extracting QR region: ${regionX},${regionY} ${regionWidth}x${regionHeight} from ${width}x${height}`
      );

      if (
        imageData.length < width * height ||
        regionWidth <= 0 ||
        regionHeight <= 0 ||
        regionX < 0 ||
        regionY < 0 ||
        regionX + regionWidth > width ||
        regionY + regionHeight > height
      ) {
        this.logger.warn("QR region is outside the aligned image bounds");
        return false;
      }

      // Extract the QR region from the full image.
      const grayscaleData = new Uint8Array(imageData);
      const regionData = new Uint8Array(regionWidth * regionHeight);

      for (let y = 0; y < regionHeight; y++) {
        const sourceStart = (regionY + y) * width + regionX;
        const destinationStart = y * regionWidth;
        regionData.set(
          grayscaleData.subarray(sourceStart, sourceStart + regionWidth),
          destinationStart
        );
      }

      const scanData = Buffer.from(regionData);
      const scanWidth = regionWidth;
      const scanHeight = regionHeight;

      this.logger.debug(`QR region extracted: ${scanWidth}x${scanHeight}`);

      // jsQR is fast when the scan is clean. OpenCV is used below as a fallback
      // for scans where blur or resampling prevents jsQR from locating the code.
      let qrData: Buffer | null = null;
      let code = jsQR(this.toRgba(scanData, scanWidth, scanHeight), scanWidth, scanHeight, {
        inversionAttempts: "attemptBoth"
      });

      if (code) {
        qrData = Buffer.from(code.binaryData);
        this.logger.debug("QR code detected with jsQR");
      }

      if (!code) {
        this.logger.debug("jsQR detection failed; trying normalized image");
        try {
          const normalized = await sharp(scanData, {
            raw: { width: scanWidth, height: scanHeight, channels: 1 }
          })
            .normalise()
            .raw()
            .toBuffer();

          code = jsQR(this.toRgba(normalized, scanWidth, scanHeight), scanWidth, scanHeight, {
            inversionAttempts: "attemptBoth"
          });

          if (code) {
            qrData = Buffer.from(code.binaryData);
            this.logger.debug("QR code detected with normalized image");
          }
        } catch (error) {
          this.logger.warn("QR normalization failed:", error);
        }
      }

      if (!code && scanWidth < 400) {
        this.logger.debug("QR region is small; trying nearest-neighbor upscaling");
        try {
          const scaleFactor = Math.ceil(400 / scanWidth);
          const scaledWidth = scanWidth * scaleFactor;
          const scaledHeight = scanHeight * scaleFactor;
          const scaled = await sharp(scanData, {
            raw: { width: scanWidth, height: scanHeight, channels: 1 }
          })
            .resize(scaledWidth, scaledHeight, { kernel: "nearest" })
            .normalise()
            .raw()
            .toBuffer();

          code = jsQR(this.toRgba(scaled, scaledWidth, scaledHeight), scaledWidth, scaledHeight, {
            inversionAttempts: "attemptBoth"
          });

          if (code) {
            qrData = Buffer.from(code.binaryData);
            this.logger.debug(`QR code detected after upscaling to ${scaledWidth}x${scaledHeight}`);
          }
        } catch (error) {
          this.logger.warn("QR upscaling failed:", error);
        }
      }

      if (!code) {
        this.logger.debug("Trying binary threshold as a final jsQR attempt");
        try {
          const thresholded = await sharp(scanData, {
            raw: { width: scanWidth, height: scanHeight, channels: 1 }
          })
            .normalise()
            .threshold(128)
            .raw()
            .toBuffer();

          code = jsQR(
            this.toRgba(thresholded, scanWidth, scanHeight),
            scanWidth,
            scanHeight,
            { inversionAttempts: "attemptBoth" }
          );

          if (code) {
            qrData = Buffer.from(code.binaryData);
            this.logger.debug("QR code detected after binary threshold");
          }
        } catch (error) {
          this.logger.warn("QR thresholding failed:", error);
        }
      }

      // OpenCV's detector is more tolerant of the blur and interpolation present
      // in scanned PDFs than jsQR. The generated payload is text, so the detector
      // result can be passed through the same decompression path as binary jsQR data.
      if (!qrData) {
        const decodedText = this.decodeWithOpenCv(scanData, scanWidth, scanHeight);
        if (decodedText) {
          qrData = Buffer.from(decodedText, "utf8");
          this.logger.debug("QR code detected with OpenCV");
        }
      }

      if (!qrData) {
        this.logger.warn("No QR code detected in ballot");
        return false;
      }

      const decompressedData = this.decompressQrData(qrData);
      if (!decompressedData) {
        this.logger.warn("QR detected, but its payload could not be decompressed");
        return false;
      }

      // Parse QR code data: ballotId:signature (timestamp removed)
      const parts = decompressedData.split(":");
      if (parts.length !== 2) {
        this.logger.warn(`Invalid QR code format: expected 2 parts, got ${parts.length}`);
        return false;
      }

      const [ballotId, signature] = parts;

      // Verify ballot ID matches
      if (ballotId !== expectedBallotId) {
        this.logger.warn(`Ballot ID mismatch: expected ${expectedBallotId}, got ${ballotId}`);
        return false;
      }

      // Verify HMAC signature (without timestamp)
      const hmac = createHmac("sha256", ballotSecret);
      hmac.update(ballotId);
      const expectedSignature = hmac.digest("hex");

      if (signature !== expectedSignature) {
        this.logger.warn("Invalid QR code signature");
        return false;
      }

      this.logger.log(`QR code verified for ballot ${ballotId}`);
      return true;
    } catch (error) {
      this.logger.error("QR code verification failed:", error);
      return false;
    }
  }

  private toRgba(data: Uint8Array, width: number, height: number): Uint8ClampedArray {
    const rgba = new Uint8ClampedArray(width * height * 4);

    for (let index = 0; index < width * height; index++) {
      const value = data[index];
      const rgbaIndex = index * 4;
      rgba[rgbaIndex] = value;
      rgba[rgbaIndex + 1] = value;
      rgba[rgbaIndex + 2] = value;
      rgba[rgbaIndex + 3] = 255;
    }

    return rgba;
  }

  private decodeWithOpenCv(data: Buffer, width: number, height: number): string | null {
    const cv = this.openCvService.getCv();
    const source = new cv.Mat(height, width, cv.CV_8UC1);
    const detector = new cv.QRCodeDetector();

    source.data.set(new Uint8Array(data));

    try {
      // Upscaling by four is important for this scan profile: the QR modules
      // are blurred during rasterization and become distinguishable after cubic interpolation.
      for (const scale of [1, 2, 3, 4]) {
        let candidate = source;
        let resized: InstanceType<typeof cv.Mat> | null = null;
        const points = new cv.Mat();

        try {
          if (scale !== 1) {
            resized = new cv.Mat();
            cv.resize(
              source,
              resized,
              new cv.Size(width * scale, height * scale),
              0,
              0,
              cv.INTER_CUBIC
            );
            candidate = resized;
          }

          const decoded = detector.detectAndDecode(candidate, points);
          if (decoded && decoded.toString().length > 0) {
            return decoded.toString();
          }
        } finally {
          points.delete();
          resized?.delete();
        }
      }
    } finally {
      detector.delete();
      source.delete();
    }

    return null;
  }

  private decompressQrData(qrData: Buffer): string | null {
    const encoded = qrData.toString("utf8").trim();

    // Current ballots contain base64(deflate(payload)). Validate the text before
    // passing it to Buffer.from because Node otherwise silently ignores bad chars.
    if (
      encoded.length > 0 &&
      encoded.length % 4 === 0 &&
      /^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
    ) {
      try {
        return inflateSync(Buffer.from(encoded, "base64")).toString("utf8");
      } catch {
        // Continue with the legacy raw-compressed format below.
      }
    }

    try {
      return inflateSync(qrData).toString("utf8");
    } catch {
      return null;
    }
  }
}
