// Test setup file for Vitest
import { vi } from 'vitest';

// Mock console methods for tests
global.console = {
  ...console,
  // Keep console.error and console.warn for debugging
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
};

// Setup fake timers
vi.useFakeTimers();

// Cleanup after each test (globals enabled in vitest.config.ts)
afterEach(() => {
  vi.clearAllTimers();
  vi.clearAllMocks();
});
