import { build, dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should render basic React component in development correctly',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
    });

    await gotoPage(page, rsbuild);

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');
    button.click();
    await expect(button).toHaveText('count: 1');

    rsbuild.close();
  },
);

rspackOnlyTest(
  'should render basic React component in production correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
    });

    await gotoPage(page, rsbuild);

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');
    button.click();
    await expect(button).toHaveText('count: 1');

    rsbuild.close();
  },
);
