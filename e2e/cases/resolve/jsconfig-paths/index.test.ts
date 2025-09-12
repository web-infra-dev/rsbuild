import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'tsconfig paths should work and override the alias config',
  async ({ page, build }) => {
    const rsbuild = await build({
      rsbuildConfig: {
        resolve: {
          alias: {
            '@common': './src/common2',
          },
        },
        source: {
          tsconfigPath: './jsconfig.json',
        },
      },
    });

    const foo = page.locator('#foo');
    await expect(foo).toHaveText('tsconfig paths worked');
  },
);

rspackOnlyTest(
  'tsconfig paths should not work when aliasStrategy is "prefer-alias"',
  async ({ page, build }) => {
    const rsbuild = await build({
      rsbuildConfig: {
        resolve: {
          alias: {
            '@/common': './src/common2',
          },
          aliasStrategy: 'prefer-alias',
        },
        source: {
          tsconfigPath: './jsconfig.json',
        },
      },
    });

    const foo = page.locator('#foo');
    await expect(foo).toHaveText('resolve.alias worked');
  },
);
