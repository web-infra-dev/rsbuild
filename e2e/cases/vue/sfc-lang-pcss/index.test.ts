import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should build Vue sfc with lang="postcss" correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
    });

    await gotoPage(page, rsbuild);

    const button = page.locator('#button');
    await expect(button).toHaveCSS('color', 'rgb(255, 0, 0)');

    await rsbuild.close();
  },
);
