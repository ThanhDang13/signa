import { BarcodeScanningResult, scanFromURLAsync } from "expo-camera";
import { decompressQrData } from "./qr-decompression";

export interface QrExtractionResult {
  ballotId: string | null;
  error: "not_found" | "decode_failed" | null;
}

/**
 * Decode the payload emitted by either the live camera scanner or image scanner.
 *
 * The QR payload is base64 encoded compressed data. Keeping this conversion here
 * ensures both scanning paths apply the same validation rules and error states.
 */
export function extractQrFromPayload(
  data: string | null | undefined,
): QrExtractionResult {
  if (!data) {
    return { ballotId: null, error: "not_found" };
  }

  try {
    const compressedData = Uint8Array.from(atob(data), (character) =>
      character.charCodeAt(0),
    );
    const qrData = decompressQrData(compressedData);
    return { ballotId: qrData.ballotId, error: null };
  } catch (error) {
    console.error("Failed to decode QR payload:", error);
    return { ballotId: null, error: "decode_failed" };
  }
}

/**
 * Extract QR code (ballotId) from a captured image.
 * Returns extraction result with ballotId and error state.
 */
export async function extractQrFromImage(
  imageUri: string,
): Promise<QrExtractionResult> {
  try {
    const results: BarcodeScanningResult[] = await scanFromURLAsync(imageUri, [
      "qr",
    ]);

    if (results.length === 0) {
      console.log("No QR code found in image");
      return { ballotId: null, error: "not_found" };
    }

    const result = extractQrFromPayload(results[0].data);
    if (result.error === "decode_failed") {
      console.log("QR code detected but decompression failed - invalid format");
    }
    return result;
  } catch (error) {
    console.error("Failed to extract QR from image:", error);
    return { ballotId: null, error: "not_found" };
  }
}
