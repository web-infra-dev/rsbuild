import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Retry on CI
  retries: process.env.CI ? 3 : 0,
  // Print line for each test being run in CI
  reporter: 'list',
  timeout: 1 * 60 * 1000, // 1 minutes
  use: {
    // Record trace on first retry of each test.
    trace: 'on-first-retry',
  },
});
