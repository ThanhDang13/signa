import pako from "pako";

/**
 * QR code data structure
 */
export interface QrCodeData {
  ballotId: string;
  signature: string;
}

/**
 * Decompress QR code data from scanned ballot
 *
 * The QR data is compressed using deflate on the server to reduce QR code size.
 * Format after decompression: "ballotId:signature"
 *
 * @param compressedData - Raw binary data from scanned QR code
 * @returns Decompressed QR code data with ballot ID and signature
 * @throws Error if decompression fails or data format is invalid
 *
 * @example
 * ```ts
 * const qrData = decompressQrData(scannedBinaryData);
 * console.log(qrData.ballotId); // "ballot-123"
 * console.log(qrData.signature); // "abc123..."
 * ```
 */
export function decompressQrData(compressedData: Uint8Array): QrCodeData {
  try {
    // Decompress the raw binary QR data using pako (same as zlib inflate)
    const decompressed = pako.inflate(compressedData, { toText: true });

    // Parse QR code data: ballotId:signature
    const parts = decompressed.split(":");
    if (parts.length !== 2) {
      throw new Error(
        `Invalid QR code format: expected 2 parts (ballotId:signature), got ${parts.length}`
      );
    }

    const [ballotId, signature] = parts;

    if (!ballotId || !signature) {
      throw new Error("QR code data is incomplete");
    }

    return {
      ballotId,
      signature
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to decompress QR code data: ${error.message}`);
    }
    throw new Error("Failed to decompress QR code data: Unknown error");
  }
}
