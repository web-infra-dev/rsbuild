import { expect } from '@playwright/test';
import { rspackOnlyTest } from '@scripts/helper';
import { build, getHrefByEntryName } from '@scripts/shared';

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

    await page.goto(getHrefByEntryName('index', rsbuild.port));

    const testEl = page.locator('#test-el');
    await expect(testEl).toHaveText('aaaaa');

    await rsbuild.close();
  },
);
