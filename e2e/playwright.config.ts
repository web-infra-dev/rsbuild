import { defineConfig } from '@playwright/test';

// Enable Rspack's config schema validation
process.env.RSPACK_CONFIG_VALIDATE = 'strict';

export default defineConfig({
  // Retry on CI
  retries: process.env.CI ? 3 : 0,
  // Print line for each test being run in CI
  reporter: 'list',
});
