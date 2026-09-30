import { describe, expect, it } from "vitest";
import { calculateImageMetrics } from "./image-metrics";
import {
  hasProperLighting,
  hasSufficientContrast,
  isSharpEnough,
} from "./image-quality-thresholds";

function rgbImage(
  width: number,
  height: number,
  value: (x: number, y: number) => number,
) {
  const data = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      const pixel = Math.max(0, Math.min(255, Math.round(value(x, y))));
      data[offset] = pixel;
      data[offset + 1] = pixel;
      data[offset + 2] = pixel;
    }
  }

  return data;
}

describe("calculateImageMetrics", () => {
  it("measures luminance and detects a sharp, high-contrast image", () => {
    const metrics = calculateImageMetrics(
      rgbImage(
        32,
        32,
        (x, y) => ((Math.floor(x / 4) + Math.floor(y / 4)) % 2) * 255,
      ),
      32,
      32,
    );

    expect(metrics.brightness).toBeCloseTo(127.5, 0);
    expect(metrics.contrast).toBeGreaterThan(99);
    expect(metrics.sharpness).toBeGreaterThan(90);
  });

  it("detects a low-contrast, evenly lit image", () => {
    const metrics = calculateImageMetrics(
      rgbImage(32, 32, () => 128),
      32,
      32,
    );

    expect(metrics.brightness).toBe(128);
    expect(metrics.contrast).toBe(0);
    expect(metrics.sharpness).toBe(0);
    expect(hasSufficientContrast(metrics.contrast)).toBe(false);
    expect(isSharpEnough(metrics.sharpness)).toBe(false);
  });

  it("detects a smooth edge as insufficiently sharp", () => {
    const metrics = calculateImageMetrics(
      rgbImage(32, 32, (x) => (x / 31) * 255),
      32,
      32,
    );

    expect(metrics.contrast).toBeGreaterThan(95);
    expect(metrics.sharpness).toBeLessThan(35);
  });

  it("rejects invalid pixel buffers", () => {
    expect(() => calculateImageMetrics(new Uint8Array(3), 2, 2)).toThrow(
      "Image data is smaller than the declared dimensions",
    );
    expect(() => calculateImageMetrics(new Uint8Array(12), 0, 2)).toThrow(
      "Image dimensions must be positive integers",
    );
  });
});

describe("quality thresholds", () => {
  it("accepts normal lighting and rejects under/overexposure", () => {
    expect(hasProperLighting(128)).toBe(true);
    expect(hasProperLighting(69)).toBe(false);
    expect(hasProperLighting(236)).toBe(false);
  });
});
