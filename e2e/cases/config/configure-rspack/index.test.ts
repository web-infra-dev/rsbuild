import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow to use tools.rspack to configure Rspack',
  async ({ page, buildPreview }) => {
    await buildPreview({
      rsbuildConfig: {
        tools: {
          rspack: (config, { rspack }) => {
            config.plugins.push(
              new rspack.DefinePlugin({
                ENABLE_TEST: JSON.stringify(true),
              }),
            );
          },
        },
      },
    });

    const testEl = page.locator('#test-el');
    await expect(testEl).toHaveText('aaaaa');
  },
);

rspackTest(
  'should allow to use async tools.rspack to configure Rspack',
  async ({ page, buildPreview }) => {
    await buildPreview({
      rsbuildConfig: {
        tools: {
          rspack: async (config, { rspack }) => {
            return new Promise<void>((resolve) => {
              setTimeout(() => {
                config.plugins.push(
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

    const testEl = page.locator('#test-el');
    await expect(testEl).toHaveText('aaaaa');
  },
);
