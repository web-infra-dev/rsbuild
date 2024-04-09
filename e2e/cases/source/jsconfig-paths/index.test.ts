import { expect, test } from '@playwright/test';
import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'tsconfig paths should work and override the alias config',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      rsbuildConfig: {
        source: {
          alias: {
            '@common': './src/common2',
          },
          tsconfigPath: './jsconfig.json',
        },
      },
    });

    await gotoPage(page, rsbuild);

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
      runServer: true,
      rsbuildConfig: {
        source: {
          alias: {
            '@/common': './src/common2',
          },
          aliasStrategy: 'prefer-alias',
          tsconfigPath: './jsconfig.json',
        },
      },
    });

    await gotoPage(page, rsbuild);

    const foo = page.locator('#foo');
    await expect(foo).toHaveText('source.alias worked');

    await rsbuild.close();
  },
);
