// Test setup file for Vitest
import { vi, afterEach } from 'vitest';

// Mock console methods for tests
global.console = {
  ...console,
  // Keep console.error and console.warn for debugging
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
};

// Cleanup after each test (globals enabled in vitest.config.ts)
afterEach(() => {
  vi.clearAllTimers();
  vi.clearAllMocks();
});
