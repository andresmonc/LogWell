/**
 * Rate limiter utility to track and enforce API rate limits
 * Tracks requests per minute to avoid exceeding API limits
 */

interface RequestRecord {
  timestamp: number;
}

class RateLimiter {
  private requests: RequestRecord[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowSeconds: number = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  /**
   * Check if a request can be made without exceeding the rate limit
   * @returns true if request can be made, false if rate limit would be exceeded
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove requests outside the time window
    this.requests = this.requests.filter(
      req => now - req.timestamp < this.windowMs
    );
    
    // Check if we're at the limit
    return this.requests.length < this.maxRequests;
  }

  /**
   * Record a request and check if it's allowed
   * @returns true if request was recorded, false if rate limit exceeded
   */
  recordRequest(): boolean {
    if (!this.canMakeRequest()) {
      return false;
    }
    
    this.requests.push({ timestamp: Date.now() });
    return true;
  }

  /**
   * Get the number of requests remaining in the current window
   */
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(
      req => now - req.timestamp < this.windowMs
    );
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Get the time until the next request slot is available (in milliseconds)
   */
  getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) {
      return 0;
    }
    
    const now = Date.now();
    const oldestRequest = this.requests[0];
    if (!oldestRequest) {
      return 0;
    }
    
    const timeSinceOldest = now - oldestRequest.timestamp;
    return Math.max(0, this.windowMs - timeSinceOldest);
  }

  /**
   * Reset the rate limiter (clear all request history)
   */
  reset(): void {
    this.requests = [];
  }
}

// Export a singleton instance for OpenFoodFacts API (10 requests per minute)
export const openFoodFactsRateLimiter = new RateLimiter(10, 60);
