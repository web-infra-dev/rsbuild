import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'tsconfig paths should work with references',
  async ({ page, buildPreview }) => {
    await buildPreview({
      config: {
        resolve: {
          alias: {
            '@common': './src/common2',
          },
        },
      },
    });

    const foo = page.locator('#foo');
    await expect(foo).toHaveText('tsconfig paths worked');
  },
);
