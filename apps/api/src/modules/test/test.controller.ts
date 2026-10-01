import { Controller, Get, Post, Body, Query, Param } from "@nestjs/common";
import { TestService } from "./test.service";
import { QueuePublisher } from "@signa/nest-queue";
import { testJob } from "./test.contract";

@Controller("test")
export class TestController {
  constructor(
    private readonly testService: TestService,
    private readonly queuePublisher: QueuePublisher
  ) {}

  /**
   * Test cache functionality
   * Call with same input multiple times to see caching in action
   *
   * GET /test/cache?input=hello
   */
  @Get("cache")
  async testCache(@Query("input") input = "default") {
    const start = Date.now();
    const result = await this.testService.expensiveOperation(input);
    const duration = Date.now() - start;

    return {
      ...result,
      duration: `${duration}ms`,
      note: "First call takes ~1s, subsequent calls with same input are instant (cached)"
    };
  }

  /**
   * Test non-cached operation for comparison
   *
   * GET /test/no-cache?input=hello
   */
  @Get("no-cache")
  async testNoCache(@Query("input") input = "default") {
    const start = Date.now();
    const result = await this.testService.simpleOperation(input);
    const duration = Date.now() - start;

    return {
      ...result,
      duration: `${duration}ms`,
      note: "This is not cached, every call increments the counter"
    };
  }

  /**
   * Publish a job to the queue (fire-and-forget)
   *
   * POST /test/queue
   * Body: { "message": "test message", "delay": 2000 }
   */
  @Post("queue")
  async testQueue(@Body() body: { message?: string; delay?: number } = {}) {
    const message = body.message || "Default test message";
    const delay = body.delay;

    const { jobId } = await this.queuePublisher.publish(
      testJob,
      {
        message,
        delay
      },
      {
        jobId: `test-${Date.now()}` // Generate unique jobId for test job
      }
    );

    return {
      success: true,
      jobId,
      message: "Job published to queue (fire-and-forget)",
      jobData: { message, delay },
      note: "Use GET /test/queue/test/:jobId to check status or POST /test/queue-sync to wait for result"
    };
  }

  /**
   * Publish a job and wait for the result (synchronous)
   * Use this for CPU-intensive tasks like OMR where you need the result
   *
   * POST /test/queue-sync
   * Body: { "message": "test message", "delay": 2000 }
   */
  @Post("queue-sync")
  async testQueueSync(@Body() body: { message?: string; delay?: number } = {}) {
    const message = body.message || "Default test message";
    const delay = body.delay;

    try {
      // Publish and wait for result (clean API!)
      const result = await this.queuePublisher.publishAndWait(
        testJob,
        { message, delay },
        { timeout: 30000 }
      );

      return {
        success: true,
        result,
        message: "Job completed successfully",
        note: "This endpoint waits for the worker to finish processing"
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Job failed or timed out",
        note: "Check job status with GET /test/queue/test/:jobId"
      };
    }
  }

  /**
   * Get job status and result by ID
   *
   * GET /test/queue/:queueName/:jobId
   */
  @Get("queue/:queueName/:jobId")
  async getJobStatus(@Param("queueName") queueName: string, @Param("jobId") jobId: string) {
    const jobInfo = await this.queuePublisher.getJob(queueName, jobId);

    if (!jobInfo) {
      return {
        success: false,
        jobId,
        status: "not_found",
        message: "Job not found"
      };
    }

    return {
      success: true,
      ...jobInfo
    };
  }

  /**
   * Get service stats
   *
   * GET /test/stats
   */
  @Get("stats")
  getStats() {
    return {
      totalCalls: this.testService.getCallCount(),
      note: "Total number of times service methods were actually called (not from cache)"
    };
  }

  /**
   * Reset service stats
   *
   * POST /test/reset
   */
  @Post("reset")
  resetStats() {
    this.testService.resetCallCount();
    return {
      success: true,
      message: "Call count reset"
    };
  }

  /**
   * Health check
   *
   * GET /test/health
   */
  @Get("health")
  health() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      endpoints: {
        cache: "GET /test/cache?input=value - Test cached operation",
        noCache: "GET /test/no-cache?input=value - Test non-cached operation",
        queueAsync: "POST /test/queue - Publish job (fire-and-forget)",
        queueSync: "POST /test/queue-sync - Publish job and wait for result",
        jobStatus: "GET /test/queue/:queueName/:jobId - Get job status and result",
        stats: "GET /test/stats - Get service statistics",
        reset: "POST /test/reset - Reset call counter"
      },
      notes: {
        queueAsync: "Returns immediately with job ID, doesn't wait for processing",
        queueSync:
          "Waits up to 30s for worker to complete and returns result (use for OMR-like tasks)",
        jobStatus: "Poll this endpoint to check if job is done and get the result"
      }
    };
  }
}
