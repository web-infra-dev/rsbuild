import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import type { RspackConfig } from '@rsbuild/shared';

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

rspackOnlyTest(
  'should allow to use async tools.rspack to configure Rspack',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      rsbuildConfig: {
        tools: {
          rspack: async (config, { rspack }) => {
            return new Promise<void>((resolve) => {
              setTimeout(() => {
                config.plugins?.push(
                  new rspack.DefinePlugin({
                    ENABLE_TEST: JSON.stringify(true),
                  }),
                );
                resolve();
              }, 0);
            });
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
