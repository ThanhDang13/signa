/**
 * Type definitions for js-aruco2
 * Library for ArUco marker detection in JavaScript/TypeScript
 */

declare module "js-aruco2/src/aruco.js" {
  export interface Corner {
    x: number;
    y: number;
  }

  export interface Marker {
    id: number;
    corners: Corner[];
  }

  export interface DetectorOptions {
    dictionaryName: "ARUCO" | "ARUCO_MIP_36h12" | string;
  }

  export class Detector {
    constructor(options: DetectorOptions);

    /**
     * Detect ArUco markers in an image
     * @param imageData - ImageData-like object with width, height, and data (Uint8ClampedArray)
     * @returns Array of detected markers
     */
    detect(imageData: {
      width: number;
      height: number;
      data: Uint8ClampedArray;
    }): Marker[];
  }

  export interface Dictionary {
    codes: Record<string, { id: number }>;
    codeList: string[];
    tau: number;
    nBits: number;
    markSize: number;
    dicName: string;
  }

  // The module exports an object with AR property containing the API
  export const AR: {
    DICTIONARIES: {
      ARUCO: {
        nBits: number;
        tau: number;
        codeList: number[];
      };
      ARUCO_MIP_36h12: {
        nBits: number;
        tau: number;
        codeList: number[];
      };
    };
    Dictionary: typeof Dictionary;
    Marker: typeof Marker;
    Detector: typeof Detector;
  };
}

declare module "js-aruco2/src/cv.js" {
  // CV utilities - currently not used but declared for completeness
  export const CV: any;
}
