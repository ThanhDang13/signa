export const QUALITY_THRESHOLDS = {
  minBrightness: 70,
  maxBrightness: 235,
  minContrast: 20,
  minSharpness: 35,
  minWidth: 1200,
  minHeight: 1500,
} as const;

export function hasProperLighting(brightness: number): boolean {
  return (
    brightness >= QUALITY_THRESHOLDS.minBrightness &&
    brightness <= QUALITY_THRESHOLDS.maxBrightness
  );
}

export function hasSufficientContrast(contrast: number): boolean {
  return contrast >= QUALITY_THRESHOLDS.minContrast;
}

export function isSharpEnough(sharpness: number): boolean {
  return sharpness >= QUALITY_THRESHOLDS.minSharpness;
}
