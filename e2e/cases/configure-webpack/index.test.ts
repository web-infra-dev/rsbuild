import { expect } from '@playwright/test';
import { webpackOnlyTest } from '@scripts/helper';
import { build, getHrefByEntryName } from '@scripts/shared';

webpackOnlyTest(
  'should allow to use tools.webpackChain to configure Webpack',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      rsbuildConfig: {
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
  },
);
