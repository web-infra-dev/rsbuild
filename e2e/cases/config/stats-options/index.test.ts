import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should log warning by default', async () => {
  const { restore, logs } = proxyConsole();

  await build({
    cwd: __dirname,
    rsbuildConfig: {},
  });

  expect(
    logs.some((log) =>
      log.includes('Using / for division outside of calc() is deprecated'),
    ),
  ).toBeTruthy();

  restore();
});

test('should not log warning when set stats.warnings false', async () => {
  const { restore, logs } = proxyConsole();

  await build({
    cwd: __dirname,
    rsbuildConfig: {
      tools: {
        bundlerChain: (chain) => {
          chain.stats({
            warnings: false,
          });
        },
      },
    },
  });

  expect(
    logs.some((log) =>
      log.includes('Using / for division outside of calc() is deprecated'),
    ),
  ).toBeFalsy();

  restore();
});
