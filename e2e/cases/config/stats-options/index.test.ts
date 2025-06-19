import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should log warning by default', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  expect(
    rsbuild.logs.some((log) =>
      log.includes('Using / for division outside of calc() is deprecated'),
    ),
  ).toBeTruthy();

  await rsbuild.close();
});

test('should not log warning when set stats.warnings false', async () => {
  const rsbuild = await build({
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
    rsbuild.logs.some((log) =>
      log.includes('Using / for division outside of calc() is deprecated'),
    ),
  ).toBeFalsy();

  await rsbuild.close();
});
