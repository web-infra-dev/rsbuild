import { build } from '@e2e/helper';
import { test } from '@playwright/test';

const WARNING_MSG = 'Using / for division outside of calc() is deprecated';

test('should log warning by default', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  await rsbuild.expectLog(WARNING_MSG);
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

  rsbuild.expectNoLog(WARNING_MSG);
  await rsbuild.close();
});
