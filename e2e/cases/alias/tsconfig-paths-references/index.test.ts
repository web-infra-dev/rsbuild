import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'tsconfig paths should work with references',
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
      },
    });

    const foo = page.locator('#foo');
    await expect(foo).toHaveText('tsconfig paths worked');

    await rsbuild.close();
  },
);
