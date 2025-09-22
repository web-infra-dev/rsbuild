import { defineConfig } from '@playwright/test';

// Enable Rspack's config schema validation
process.env.RSPACK_CONFIG_VALIDATE = 'strict';
process.env.PROVIDE_TYPE ||= 'rspack';
// https://playwright.dev/docs/service-workers-experimental
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

export default defineConfig({
  // Retry on CI
  retries: process.env.CI ? 3 : 0,
  // Print line for each test being run in CI
  reporter: 'list',
});
