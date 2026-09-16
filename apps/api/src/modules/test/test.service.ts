import { Injectable } from "@nestjs/common";
import { Cache } from "@signa/nest-cache";

@Injectable()
export class TestService {
  private callCount = 0;

  /**
   * Test method with caching - should only compute once for same input
   */
  @Cache<string>({
    key: (input) => `test:expensive:${input}`,
    ttl: 60, // 60 seconds
    debug: true
  })
  async expensiveOperation(
    input: string
  ): Promise<{ result: string; callCount: number; timestamp: string }> {
    this.callCount++;

    // Simulate expensive operation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      result: `Processed: ${input}`,
      callCount: this.callCount,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test method without caching
   */
  async simpleOperation(
    input: string
  ): Promise<{ result: string; callCount: number; timestamp: string }> {
    this.callCount++;

    return {
      result: `Simple: ${input}`,
      callCount: this.callCount,
      timestamp: new Date().toISOString()
    };
  }

  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }
}
