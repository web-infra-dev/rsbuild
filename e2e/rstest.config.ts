import { defineConfig } from '@rstest/core';

// Disable color in test.
process.env.NO_COLOR = '1';

// https://playwright.dev/docs/service-workers-experimental
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  include: ['cases/**/*.test.ts'],
  exclude: ['**/node_modules/**', '**/.*/**', '**/test-temp-*/**'],
  reporters: 'default',
  // Share a single worker across all test files (no per-file isolation), which
  // matches the previous Playwright runner and is meaningfully faster.
  isolate: false,
  // Required together with `isolate: false`. rsbuild prints build-completion
  // logs ("ready built in Xs", asset table) in a deferred compiler `done` hook
  // that can fire AFTER `rsbuild.build()` (and the test) has resolved. With the
  // worker shared across files, rstest has already `$close()`-d that file's
  // birpc channel, and its console interceptor forwards the late log over the
  // closed channel as an unawaited `rpc.onConsoleLog` call -> unhandled
  // rejection -> spuriously fails whichever file is currently active. Disabling
  // the interceptor routes console straight to stdout, so late logs are
  // harmless (as they were under Playwright). Log assertions are unaffected:
  // the helper captures via its own `proxyConsole`, not rstest's interceptor.
  disableConsoleIntercept: true,
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
