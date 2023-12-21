import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

test('should allow to use tools.bundlerChain to set alias config', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      tools: {
        bundlerChain: (chain) => {
          chain.resolve.alias.merge({
            '@common': join(__dirname, 'src/common'),
          });
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));
  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild! 1');

  await rsbuild.close();
});
