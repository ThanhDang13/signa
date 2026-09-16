import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import cvModule from "@techstark/opencv-js";

// Re-export the CV type for use in other services
export type CV = typeof cvModule;

// Type alias for OpenCV Mat instances
export type CvMat = InstanceType<CV["Mat"]>;

/**
 * Service that properly initializes OpenCV.js and provides the initialized instance
 * to other services. Follows the async initialization pattern required by @techstark/opencv-js.
 */
@Injectable()
export class OpenCvService implements OnModuleInit {
  private readonly logger = new Logger(OpenCvService.name);
  private cvInstance: CV | null = null;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize OpenCV.js during NestJS module initialization
   */
  async onModuleInit(): Promise<void> {
    this.logger.log("Initializing OpenCV.js...");

    try {
      this.cvInstance = await this.initializeOpenCv();
      this.logger.log("OpenCV.js initialized successfully");
      this.logger.debug(`OpenCV version: ${this.cvInstance.getBuildInformation()}`);
    } catch (error) {
      this.logger.error("Failed to initialize OpenCV.js:", error);
      throw error;
    }
  }

  /**
   * Get the initialized OpenCV instance
   * @throws Error if OpenCV.js is not initialized yet
   */
  getCv(): CV {
    if (!this.cvInstance) {
      throw new Error("OpenCV.js is not initialized. Ensure the module has been initialized.");
    }
    return this.cvInstance;
  }

  /**
   * Initialize OpenCV.js following the pattern from the package README
   * Handles both Promise-based and callback-based initialization
   */
  private async initializeOpenCv(): Promise<CV> {
    // If cvModule is a Promise, await it directly
    if (cvModule instanceof Promise) {
      this.logger.debug("OpenCV module is a Promise, awaiting...");
      return await cvModule;
    }

    // If cvModule already has Mat property, it's ready to use
    if ("Mat" in cvModule && cvModule.Mat) {
      this.logger.debug("OpenCV module is already initialized");
      return cvModule;
    }

    // Otherwise, wait for onRuntimeInitialized callback
    this.logger.debug("Waiting for OpenCV runtime initialization...");
    await new Promise<void>((resolve) => {
      (cvModule as any).onRuntimeInitialized = () => {
        this.logger.debug("OpenCV runtime initialized via callback");
        resolve();
      };
    });

    return cvModule;
  }

  /**
   * Check if OpenCV.js is initialized and ready to use
   */
  isInitialized(): boolean {
    return this.cvInstance !== null && "Mat" in this.cvInstance;
  }
}
