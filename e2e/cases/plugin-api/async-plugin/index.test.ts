import { expect, rspackOnlyTest } from '@e2e/helper';
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
  async ({ page, build }) => {
    await build({
      plugins: [asyncPlugin()],
    });

    const testEl = page.locator('#test-el');
    await expect(testEl).toHaveText('aaaaa');
  },
);
