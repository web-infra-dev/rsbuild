import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '../scripts/shared';

const fixtures = __dirname;

test('webpackChain - register plugin', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'source/global-vars'),
    runServer: true,
    rsbuildConfig: {
      source: {
        entries: {
          index: join(fixtures, 'source/global-vars/src/index.ts'),
        },
      },
      tools: {
        webpackChain: (chain, { webpack }) => {
          chain.plugin('define').use(webpack.DefinePlugin, [
            {
              ENABLE_TEST: JSON.stringify(true),
            },
          ]);
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  await rsbuild.close();
});
