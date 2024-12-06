import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'tsconfig paths should work and override the alias config',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
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

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'tsconfig paths should not work when aliasStrategy is "prefer-alias"',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
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

    await rsbuild.close();
  },
);
