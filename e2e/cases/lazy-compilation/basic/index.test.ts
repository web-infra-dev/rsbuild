import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should render pages correctly when using lazy compilation',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
    });

    await gotoPage(page, rsbuild, 'page1');
    await expect(page.locator('#test')).toHaveText('Page 1');

    await gotoPage(page, rsbuild, 'page2');
    await expect(page.locator('#test')).toHaveText('Page 2');

    rsbuild.close();
  },
);
