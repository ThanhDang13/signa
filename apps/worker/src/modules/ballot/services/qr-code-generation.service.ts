import { Injectable } from "@nestjs/common";
import QRCode from "qrcode";
import { deflateSync } from "zlib";

export interface QrCodeData {
  ballotId: string;
  signature: string;
}

/**
 * Service for generating QR codes for ballots
 */
@Injectable()
export class QrCodeGenerationService {
  /**
   * Generate a QR code as a data URL
   * @param data - QR code payload
   * @returns Base64 data URL that can be embedded in PDFs or images
   */
  async generate(data: QrCodeData): Promise<string> {
    // Format: ballotId:signature (timestamp removed to reduce size)
    const qrData = `${data.ballotId}:${data.signature}`;

    // Compress the data using deflate to reduce QR version
    const compressed = deflateSync(Buffer.from(qrData, "utf-8"));

    // Encode compressed data as base64 for mobile compatibility
    // Mobile QR scanners struggle with raw binary byte mode
    // Base64 encoding adds ~33% overhead but ensures compatibility
    const base64Compressed = compressed.toString("base64");

    // Generate high-resolution QR code for print quality
    return QRCode.toDataURL(base64Compressed, {
      errorCorrectionLevel: "M", // Medium error correction (balanced size vs recovery)
      width: 600, // High resolution for crisp printing and scanning
      margin: 2   // Adequate quiet zone around QR code
    });
  }
}
