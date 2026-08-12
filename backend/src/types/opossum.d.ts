declare module 'opossum' {
  interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    name?: string;
    [key: string]: any;
  }

  class CircuitBreaker {
    constructor(action: (...args: any[]) => any, options?: CircuitBreakerOptions);
    fire(...args: any[]): Promise<any>;
    fallback(fn: (...args: any[]) => any): CircuitBreaker;
    open: boolean;
    halfOpen: boolean;
    closed: boolean;
    on(event: string, callback: (...args: any[]) => void): void;
  }

  export default CircuitBreaker;
}