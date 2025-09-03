/**
 * @acme/pubsubx - Type definitions
 * 
 * Comprehensive type definitions following SOLID principles and ensuring type safety.
 * All interfaces are designed for extensibility and maintainability.
 */

import type { PubSub, Topic, Subscription, Message, ClientConfig } from '@google-cloud/pubsub';
import type Redis from 'ioredis';

// Re-export Google Cloud Pub/Sub types for convenience
export type { PubSub, Topic, Subscription, Message, ClientConfig };

/**
 * Configuration options for creating a Pub/Sub client
 * 
 * Follows the principle of explicit configuration with sensible defaults.
 * All options are passed through to the underlying SDK for maximum flexibility.
 */
export interface PubSubClientOptions extends Partial<ClientConfig> {
  /** Google Cloud Project ID - required for most operations */
  projectId?: string;
  /** Service account key file path */
  keyFilename?: string;
  /** Explicit credentials object for authentication */
  credentials?: object;
  /** API endpoint override for testing or custom environments */
  apiEndpoint?: string;
}

/**
 * Publisher-specific configuration options
 * 
 * Designed for performance and reliability with proper error handling.
 */
export interface PublisherOptions {
  /** Default attributes applied to all published messages */
  attributesDefaults?: Record<string, string>;
  /** Function to generate ordering key from message data for ordered delivery */
  orderingKeySelector?: (data: unknown) => string | undefined;
  // Note: Advanced options like batching and retry will be added in v2.0
  // to maintain compatibility with the underlying SDK
}

/**
 * Consumer-specific configuration options
 * 
 * Comprehensive options for reliable message processing with idempotency.
 */
export interface ConsumerOptions {
  /** Enable Redis-backed idempotency for duplicate message handling */
  idempotencyEnabled?: boolean;
  /** Redis configuration (required if idempotencyEnabled is true) */
  redis?: RedisOptions;
  /** Pre-configured idempotency store instance (alternative to redis config) */
  idempotencyStore?: IdempotencyStore;
  /** Function to extract idempotency key from message */
  idempotencyKeySelector?: (message: Message) => string;
  /** Observability and monitoring hooks */
  hooks?: ConsumerHooks;
  // Note: Advanced flow control, DLQ, and error handling options will be added in v2.0
  // to maintain compatibility with the underlying SDK
}

/**
 * Lifecycle hooks for consumer monitoring and observability
 */
export interface ConsumerHooks {
  /** Called when a message is received but before processing */
  onMessageReceived?: (message: Message) => void | Promise<void>;
  /** Called when message processing starts */
  onMessageStart?: (message: Message) => void | Promise<void>;
  /** Called when message processing completes successfully */
  onMessageSuccess?: (message: Message, data: unknown) => void | Promise<void>;
  /** Called when message processing fails */
  onMessageError?: (message: Message, error: Error) => void | Promise<void>;
  /** Called when a message is acknowledged */
  onMessageAck?: (message: Message) => void | Promise<void>;
  /** Called when a message is nacked */
  onMessageNack?: (message: Message) => void | Promise<void>;
  /** Called when idempotency check is performed */
  onIdempotencyCheck?: (key: string, exists: boolean) => void | Promise<void>;
}

/**
 * Redis connection configuration with comprehensive options
 */
export interface RedisOptions {
  /** Redis connection URL (redis://localhost:6379) */
  url?: string;
  /** Redis host (default: localhost) */
  host?: string;
  /** Redis port (default: 6379) */
  port?: number;
  /** Redis password for authentication */
  password?: string;
  /** Redis database number (default: 0) */
  db?: number;
  /** Key prefix for idempotency keys (default: 'pubsubx:idemp:') */
  keyPrefix?: string;
  /** TTL for idempotency keys in milliseconds (default: 6 hours) */
  ttl?: number;
  /** Existing Redis client instance (ioredis or node-redis) */
  client?: Redis | unknown;
  /** Connection timeout in milliseconds */
  connectTimeout?: number;
  /** Command timeout in milliseconds */
  commandTimeout?: number;
  /** Enable automatic retry on connection failure */
  retryOnFailure?: boolean;
  /** Maximum number of connection retries */
  maxRetries?: number;
}

/**
 * Abstract interface for idempotency stores
 * 
 * Designed to support multiple implementations (Redis, Memory, etc.)
 * following the Interface Segregation Principle.
 */
export interface IdempotencyStore {
  /** Check if a key exists in the store */
  has(key: string): Promise<boolean>;
  /** Set a key in the store with optional TTL */
  set(key: string, ttl?: number): Promise<void>;
  /** Remove a key from the store */
  delete?(key: string): Promise<void>;
  /** Get store statistics for monitoring */
  getStats?(): Promise<IdempotencyStoreStats>;
  /** Close the store and cleanup resources */
  close(): Promise<void>;
}

/**
 * Statistics for idempotency store monitoring
 */
export interface IdempotencyStoreStats {
  /** Total number of keys in the store */
  totalKeys: number;
  /** Number of successful checks */
  successfulChecks: number;
  /** Number of failed checks */
  failedChecks: number;
  /** Memory usage in bytes (if applicable) */
  memoryUsage?: number;
  /** Connection status */
  connectionStatus: 'connected' | 'disconnected' | 'error';
  /** Last error if any */
  lastError?: string;
}

/**
 * Message data with proper JSON serialization support
 */
export interface MessageData {
  /** The actual message payload */
  [key: string]: unknown;
}

/**
 * Published message result
 */
export interface PublishResult {
  /** Message ID returned by Pub/Sub */
  messageId: string;
  /** Timestamp when message was published */
  publishedAt: Date;
  /** Ordering key used (if any) */
  orderingKey?: string;
  /** Attributes attached to the message */
  attributes: Record<string, string>;
}

/**
 * Message handler function type with proper typing
 */
export type MessageHandler<T = MessageData> = (
  data: T,
  message: Message
) => Promise<void> | void;

/**
 * Error handler function type with detailed context
 */
export type ErrorHandler = (
  error: Error,
  context?: ErrorContext
) => void | Promise<void>;

/**
 * Error context for detailed error handling
 */
export interface ErrorContext {
  /** Message ID if error is related to a specific message */
  messageId?: string;
  /** Processing phase where error occurred */
  phase?: 'receive' | 'parse' | 'idempotency' | 'handle' | 'ack' | 'nack';
  /** Additional context data */
  metadata?: Record<string, unknown>;
  /** Retry attempt number */
  retryAttempt?: number;
  /** Original message if available */
  message?: Message;
}

/**
 * Consumer event types with comprehensive monitoring
 */
export interface ConsumerEvents {
  /** Fired when a message is received and ready for processing */
  message: MessageHandler;
  /** Fired when an error occurs during message processing */
  error: ErrorHandler;
  /** Fired when consumer starts */
  start?: () => void | Promise<void>;
  /** Fired when consumer stops */
  stop?: () => void | Promise<void>;
  /** Fired when idempotency check occurs */
  idempotencyCheck?: (key: string, exists: boolean) => void | Promise<void>;
}

/**
 * Logger interface for structured logging
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

/**
 * Metrics interface for observability
 */
export interface Metrics {
  /** Increment a counter */
  increment(name: string, value?: number, tags?: Record<string, string>): void;
  /** Record a timing measurement */
  timing(name: string, value: number, tags?: Record<string, string>): void;
  /** Set a gauge value */
  gauge(name: string, value: number, tags?: Record<string, string>): void;
  /** Record a histogram value */
  histogram(name: string, value: number, tags?: Record<string, string>): void;
}

/**
 * Health check result
 */
export interface HealthCheck {
  /** Component name */
  component: string;
  /** Health status */
  status: 'healthy' | 'unhealthy' | 'degraded';
  /** Last check timestamp */
  timestamp: Date;
  /** Optional details */
  details?: Record<string, unknown>;
  /** Response time in milliseconds */
  responseTimeMs?: number;
}

/**
 * Library configuration for advanced features
 */
export interface LibraryConfig {
  /** Logger instance for structured logging */
  logger?: Logger;
  /** Metrics instance for observability */
  metrics?: Metrics;
  /** Enable health checks */
  enableHealthChecks?: boolean;
  /** Global error handler */
  globalErrorHandler?: ErrorHandler;
}

// =============================================================================
// UTILITY TYPES AND CONSTANTS
// =============================================================================

/**
 * Utility type for making specific properties required
 */
export type RequireOnly<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

/**
 * Utility type for extracting the data type from a MessageHandler
 */
export type ExtractMessageData<T> = T extends MessageHandler<infer U> ? U : never;

/**
 * Common message attributes used across the library
 */
export const MessageAttributes = {
  /** Source service or application */
  SOURCE: 'source',
  /** Message type or event name */
  TYPE: 'type',
  /** Message version for schema evolution */
  VERSION: 'version',
  /** Correlation ID for request tracing */
  CORRELATION_ID: 'correlationId',
  /** Timestamp when message was created */
  TIMESTAMP: 'timestamp',
  /** Content type of the message payload */
  CONTENT_TYPE: 'contentType',
} as const;

/**
 * Default configuration values
 */
export const Defaults = {
  /** Default Redis key prefix */
  REDIS_KEY_PREFIX: 'pubsubx:idemp:',
  /** Default idempotency TTL (6 hours) */
  IDEMPOTENCY_TTL_MS: 6 * 60 * 60 * 1000,
  /** Default max concurrent messages */
  MAX_CONCURRENCY: 100,
  /** Default acknowledgment deadline */
  ACK_DEADLINE_SECONDS: 600,
  /** Default flow control max messages */
  FLOW_CONTROL_MAX_MESSAGES: 1000,
  /** Default flow control max bytes */
  FLOW_CONTROL_MAX_BYTES: 1024 * 1024 * 10, // 10MB
} as const;

/**
 * Error codes for consistent error handling
 */
export const ErrorCodes = {
  /** Authentication failed */
  AUTH_FAILED: 'AUTH_FAILED',
  /** Configuration is invalid */
  INVALID_CONFIG: 'INVALID_CONFIG',
  /** Message parsing failed */
  PARSE_ERROR: 'PARSE_ERROR',
  /** Idempotency store error */
  IDEMPOTENCY_ERROR: 'IDEMPOTENCY_ERROR',
  /** Redis connection error */
  REDIS_ERROR: 'REDIS_ERROR',
  /** Message handler error */
  HANDLER_ERROR: 'HANDLER_ERROR',
  /** Acknowledgment failed */
  ACK_ERROR: 'ACK_ERROR',
  /** Publisher error */
  PUBLISH_ERROR: 'PUBLISH_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
