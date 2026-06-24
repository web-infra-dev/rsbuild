import { defineConfig } from '@rstest/core';

// Disable color in test.
process.env.NO_COLOR = '1';

// https://playwright.dev/docs/service-workers-experimental
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  include: ['cases/**/*.test.ts'],
  exclude: ['**/node_modules/**', '**/.*/**', '**/test-temp-*/**'],
  isolate: false,
  reporters: 'default',
  retry: isCI ? 3 : 0,
  testTimeout: 30_000,
  hookTimeout: 30_000,
  source: {
    tsconfigPath: './tsconfig.json',
  },
  output: {
    externals: ['@rsbuild/core'],
  },
});
