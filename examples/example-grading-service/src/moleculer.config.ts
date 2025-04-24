import type { BrokerOptions } from "moleculer";

const brokerConfig: BrokerOptions = {
  namespace: "grading-system",
  nodeID: process.env.NODE_ID || "grader-service",
  
  logger: true,
  logLevel: "info",
  
  // Transporter for communication with other services
  transporter: process.env.TRANSPORTER || "NATS",
  
  // Disable timeout feature
  requestTimeout: 0,
  
  // Enable tracking for graceful shutdown
  tracking: {
    enabled: true,
    shutdownTimeout: 10000
  },
  
  // Enable metrics
  metrics: {
    enabled: true
  },
  
  // Configure circuit breaker
  circuitBreaker: {
    enabled: true,
    threshold: 0.5,
    minRequestCount: 20,
    windowTime: 60
  },
  
  // Retry policy
  retryPolicy: {
    enabled: true,
    retries: 3,
    delay: 100,
    maxDelay: 1000,
    factor: 2
  }
};

export default brokerConfig;
