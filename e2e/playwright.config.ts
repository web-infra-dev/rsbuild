import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Retry on CI
  retries: process.env.CI ? 3 : 0,
});
