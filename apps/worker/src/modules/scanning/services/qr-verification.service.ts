import { Injectable, Logger } from "@nestjs/common";
import jsQR from "jsqr";
import { createHmac } from "crypto";
import { inflateSync } from "zlib";
import sharp from "sharp";

/**
 * Service for QR code verification with HMAC signature validation
 */
@Injectable()
export class QrVerificationService {
  private readonly logger = new Logger(QrVerificationService.name);

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
      const mmToPixels = 300 / 25.4; // 300 DPI conversion
      const regionX = Math.round(qrRegion.x * mmToPixels);
      const regionY = Math.round(qrRegion.y * mmToPixels);
      const regionWidth = Math.round(qrRegion.width * mmToPixels);
      const regionHeight = Math.round(qrRegion.height * mmToPixels);

      this.logger.debug(
        `Extracting QR region: ${regionX},${regionY} ${regionWidth}x${regionHeight} from ${width}x${height}`
      );

      // Extract the QR region from the full image
      const grayscaleData = new Uint8Array(imageData);
      const regionData = new Uint8Array(regionWidth * regionHeight);

      for (let y = 0; y < regionHeight; y++) {
        for (let x = 0; x < regionWidth; x++) {
          const srcX = regionX + x;
          const srcY = regionY + y;
          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            const srcIndex = srcY * width + srcX;
            const dstIndex = y * regionWidth + x;
            regionData[dstIndex] = grayscaleData[srcIndex];
          }
        }
      }

      const scanData = Buffer.from(regionData);
      const scanWidth = regionWidth;
      const scanHeight = regionHeight;

      this.logger.debug(`QR region extracted: ${scanWidth}x${scanHeight}`);

      this.logger.debug(`QR verification: image ${scanWidth}x${scanHeight}, buffer length ${scanData.length}`);

      // jsQR expects RGBA data (4 bytes per pixel)
      // Convert grayscale buffer to RGBA Uint8ClampedArray
      const scanGrayscaleData = new Uint8Array(scanData);
      const expectedLength = scanWidth * scanHeight;

      if (scanGrayscaleData.length !== expectedLength) {
        this.logger.error(
          `Buffer size mismatch: expected ${expectedLength} bytes for ${scanWidth}x${scanHeight}, got ${scanGrayscaleData.length}`
        );
        return false;
      }

      const rgbaData = new Uint8ClampedArray(scanWidth * scanHeight * 4);

      for (let i = 0; i < scanGrayscaleData.length; i++) {
        const grayValue = scanGrayscaleData[i];
        const rgbaIndex = i * 4;
        rgbaData[rgbaIndex] = grayValue;     // R
        rgbaData[rgbaIndex + 1] = grayValue; // G
        rgbaData[rgbaIndex + 2] = grayValue; // B
        rgbaData[rgbaIndex + 3] = 255;       // A (fully opaque)
      }

      this.logger.debug(`Converted to RGBA: ${rgbaData.length} bytes`);

      // Try multiple detection strategies for better success rate
      let code = jsQR(rgbaData, scanWidth, scanHeight, {
        inversionAttempts: "attemptBoth" // Try both normal and inverted
      });

      // If detection fails, try with image preprocessing
      if (!code) {
        this.logger.debug("First QR detection attempt failed, trying with preprocessing...");

        // Apply contrast enhancement and try again
        try {
          const enhancedBuffer = await sharp(Buffer.from(scanGrayscaleData), {
            raw: { width: scanWidth, height: scanHeight, channels: 1 }
          })
            .normalize() // Auto-adjust contrast
            .threshold(128) // Binary threshold to make QR clearer
            .raw()
            .toBuffer();

          // Convert enhanced buffer to RGBA
          const enhancedRgba = new Uint8ClampedArray(scanWidth * scanHeight * 4);
          for (let i = 0; i < enhancedBuffer.length; i++) {
            const value = enhancedBuffer[i];
            const rgbaIndex = i * 4;
            enhancedRgba[rgbaIndex] = value;
            enhancedRgba[rgbaIndex + 1] = value;
            enhancedRgba[rgbaIndex + 2] = value;
            enhancedRgba[rgbaIndex + 3] = 255;
          }

          code = jsQR(enhancedRgba, scanWidth, scanHeight, {
            inversionAttempts: "attemptBoth"
          });

          if (code) {
            this.logger.debug("QR code detected after preprocessing");
          }
        } catch (preprocessError) {
          this.logger.warn("QR preprocessing failed:", preprocessError);
        }
      }

      if (!code) {
        this.logger.warn("No QR code detected in ballot");
        return false;
      }

      this.logger.debug(`QR code detected, data length: ${code.binaryData.length} bytes`);

      // Decompress the raw binary QR data
      let decompressedData: string;
      try {
        const decompressed = inflateSync(Buffer.from(code.binaryData));
        decompressedData = decompressed.toString("utf-8");
      } catch (error) {
        this.logger.warn("Failed to decompress QR code data");
        return false;
      }

      this.logger.debug(`Decompressed QR data: ${decompressedData}`);

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
      const signatureData = ballotId;
      const hmac = createHmac("sha256", ballotSecret);
      hmac.update(signatureData);
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
}
