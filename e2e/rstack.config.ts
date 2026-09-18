import { define } from 'rstack';

define.test(() => {
  // Disable color in test.
  process.env.NO_COLOR = '1';

  // https://playwright.dev/docs/service-workers-experimental
  process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

  const isCI = Boolean(process.env.CI);

  return {
    include: ['cases/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.*/**', '**/test-temp-*/**'],
    reporters: ['default', ['github-actions', { annotations: false }]],
    isolate: false,
    // Existing e2e helpers capture build logs synchronously; interception delays them.
    disableConsoleIntercept: true,
    retry: isCI ? 3 : 0,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    expect: {
      poll: {
        // Preserve the 5s Playwright assertion timeout used before Rstest 0.12.
        timeout: 5_000,
      },
    },
    output: {
      externals: ['@rsbuild/core'],
    },
  };
});
