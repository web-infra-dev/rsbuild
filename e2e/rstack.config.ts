import { definePlaywrightConfig } from '@rstest/playwright/config';
import { define } from 'rstack';

define.test(() => {
  // Disable color in test.
  process.env.NO_COLOR = '1';

  // https://playwright.dev/docs/service-workers-experimental
  process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

  const isCI = Boolean(process.env.CI);

  return {
    extends: definePlaywrightConfig({
      launchOptions: {
        // Use the built-in Chrome browser to speed up CI tests
        channel: isCI ? 'chrome' : undefined,
      },
    }),
    include: ['cases/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.*/**', '**/test-temp-*/**'],
    reporters: ['default', ['github-actions', { annotations: false }]],
    isolate: false,
    // Existing e2e helpers capture build logs synchronously; interception delays them.
    disableConsoleIntercept: true,
    retry: isCI ? 3 : 0,
    output: {
      externals: ['@rsbuild/core'],
    },
  };
});
