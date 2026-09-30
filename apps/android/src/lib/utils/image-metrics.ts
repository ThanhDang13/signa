export interface ImageMetrics {
  brightness: number;
  contrast: number;
  sharpness: number;
}

const SHARPNESS_REFERENCE_VARIANCE = 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundMetric(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Calculate image metrics from an RGB or RGBA pixel buffer.
 *
 * This is intentionally a pure function so the scoring can be tested without
 * a camera or an Expo runtime. The caller should pass a downscaled image when
 * analyzing a camera capture.
 */
export function calculateImageMetrics(
  data: Uint8Array,
  width: number,
  height: number,
  channels = 3,
): ImageMetrics {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1
  ) {
    throw new Error("Image dimensions must be positive integers");
  }

  if (channels !== 3 && channels !== 4) {
    throw new Error("Image data must contain 3 (RGB) or 4 (RGBA) channels");
  }

  if (data.length < width * height * channels) {
    throw new Error("Image data is smaller than the declared dimensions");
  }

  const luminance = new Float32Array(width * height);
  const histogram = new Uint32Array(256);
  let brightnessSum = 0;

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * channels;
    const value =
      0.2126 * data[offset] +
      0.7152 * data[offset + 1] +
      0.0722 * data[offset + 2];

    luminance[pixel] = value;
    brightnessSum += value;
    histogram[Math.min(255, Math.floor(value))] += 1;
  }

  const pixelCount = width * height;
  const brightness = brightnessSum / pixelCount;
  const lowPercentile = percentileFromHistogram(histogram, pixelCount * 0.01);
  const highPercentile = percentileFromHistogram(histogram, pixelCount * 0.99);
  const contrast = ((highPercentile - lowPercentile) / 255) * 100;

  // The variance of the 3x3 Laplacian is a standard focus/blur measure. A
  // flat image has variance 0; a sharp image has many strong local edges.
  let sharpness = 0;
  if (width >= 3 && height >= 3) {
    let count = 0;
    let mean = 0;
    let squaredDifferenceSum = 0;

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const center = y * width + x;
        const laplacian =
          4 * luminance[center] -
          luminance[center - width] -
          luminance[center + width] -
          luminance[center - 1] -
          luminance[center + 1];

        count += 1;
        const delta = laplacian - mean;
        mean += delta / count;
        squaredDifferenceSum += delta * (laplacian - mean);
      }
    }

    const variance = count > 1 ? squaredDifferenceSum / (count - 1) : 0;
    sharpness =
      (Math.log1p(Math.max(0, variance)) /
        Math.log1p(SHARPNESS_REFERENCE_VARIANCE)) *
      100;
  }

  return {
    brightness: roundMetric(brightness),
    contrast: roundMetric(clamp(contrast, 0, 100)),
    sharpness: roundMetric(clamp(sharpness, 0, 100)),
  };
}

function percentileFromHistogram(histogram: Uint32Array, rank: number): number {
  const target = clamp(
    Math.ceil(rank),
    1,
    histogram.reduce((sum, count) => sum + count, 0),
  );
  let seen = 0;

  for (let value = 0; value < histogram.length; value += 1) {
    seen += histogram[value];
    if (seen >= target) return value;
  }

  return histogram.length - 1;
}
