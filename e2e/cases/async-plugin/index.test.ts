import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import type { RsbuildPlugin } from '@rsbuild/core';

const asyncPlugin = async (): Promise<RsbuildPlugin> => {
  await new Promise((resolve) => {
    setTimeout(resolve);
  });

  return {
    name: 'async-plugin',
    setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(config, {
          source: {
            define: {
              ENABLE_TEST: JSON.stringify(true),
            },
          },
        });
      });
    },
  };
};

rspackOnlyTest(
  'should allow to register async plugin in plugins field',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      plugins: [asyncPlugin()],
    });

    await gotoPage(page, rsbuild);

    const testEl = page.locator('#test-el');
    await expect(testEl).toHaveText('aaaaa');

    await rsbuild.close();
  },
);
