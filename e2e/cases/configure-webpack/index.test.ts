import { build, gotoPage, webpackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

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

    await gotoPage(page, rsbuild);

    const testEl = page.locator('#test-el');
    await expect(testEl).toHaveText('aaaaa');

    await rsbuild.close();
  },
);
