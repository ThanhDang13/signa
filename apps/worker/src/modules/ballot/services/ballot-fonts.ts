import type PDFDocument from "pdfkit";
import { join } from "path";

/**
 * Font names registered with PDFKit for ballot generation
 * These are custom names that map to the Roboto font files
 */
export const BALLOT_FONT_REGULAR = "BallotFont";
export const BALLOT_FONT_BOLD = "BallotFont-Bold";

/**
 * Normalize text to NFC (Canonical Decomposition, followed by Canonical Composition)
 * This ensures Vietnamese diacritics are represented consistently for proper PDF rendering
 *
 * @param text - Text to normalize
 * @returns NFC-normalized text
 */
export function nfc(text: string): string {
  return text.normalize("NFC");
}

/**
 * Get the font directory path
 * In development: apps/worker/assets/fonts
 * In production build: dist/assets/fonts (resolved relative to this compiled file)
 *
 * Override via BALLOT_FONT_DIR environment variable if needed
 */
function getFontDir(): string {
  if (process.env.BALLOT_FONT_DIR) {
    return process.env.BALLOT_FONT_DIR;
  }

  // This file compiles to: dist/modules/ballot/services/ballot-fonts.js
  // Font files are at: dist/assets/fonts/
  // So we go up 3 levels: services -> ballot -> modules -> dist, then down to assets/fonts
  return join(__dirname, "..", "..", "..", "assets", "fonts");
}

/**
 * Register custom fonts with a PDFKit document
 * Must be called once per document before any .font() or .text() calls
 *
 * @param doc - PDFKit document instance
 */
export function registerBallotFonts(doc: typeof PDFDocument.prototype): void {
  const fontDir = getFontDir();

  doc.registerFont(BALLOT_FONT_REGULAR, join(fontDir, "Roboto-Regular.ttf"));
  doc.registerFont(BALLOT_FONT_BOLD, join(fontDir, "Roboto-Bold.ttf"));
}
