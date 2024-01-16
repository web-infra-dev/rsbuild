import { expect } from '@playwright/test';
import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to use tools.rspack to configure Rspack',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      rsbuildConfig: {
        tools: {
          rspack: (config, { rspack }) => {
            config.plugins?.push(
              new rspack.DefinePlugin({
                ENABLE_TEST: JSON.stringify(true),
              }),
            );
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
