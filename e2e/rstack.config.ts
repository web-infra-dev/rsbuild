import { definePlaywrightConfig } from '@rstest/playwright/config';
import type { RstestConfig } from '@rstest/core';
import { define } from 'rstack';

define.test(() => {
  // Disable color in test.
  process.env.NO_COLOR = '1';

  // https://playwright.dev/docs/service-workers-experimental
  process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

  // Use 'legacy' or 'off' to compare against the old cache or original e2e defaults.
  process.env.RSBUILD_E2E_CACHE ??= 'new';

  const isCI = Boolean(process.env.CI);
  const reportPath = process.env.RSBUILD_E2E_REPORT_PATH;
  const reporters: RstestConfig['reporters'] = [
    'default',
    ['github-actions', { annotations: false }],
  ];
  if (reportPath) {
    reporters.push(['json', { outputPath: reportPath }]);
  }

  return {
    extends: definePlaywrightConfig({
      launchOptions: {
        // Use the built-in Chrome browser to speed up CI tests
        channel: isCI ? 'chrome' : undefined,
      },
    }),
    include: ['cases/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.*/**', '**/test-temp-*/**'],
    reporters,
    isolate: false,
    // Existing e2e helpers capture build logs synchronously; interception delays them.
    disableConsoleIntercept: true,
    retry: isCI ? 3 : 0,
    output: {
      externals: ['@rsbuild/core'],
    },
  };
});
