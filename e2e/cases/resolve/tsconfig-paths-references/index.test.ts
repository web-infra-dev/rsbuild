import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'tsconfig paths should work with references',
  async ({ page, build }) => {
    await build({
      rsbuildConfig: {
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
