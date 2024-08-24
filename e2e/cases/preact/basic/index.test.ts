import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should render basic Preact component in development correctly',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');
    button.click();
    await expect(button).toHaveText('count: 1');

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should render basic Preact component in production correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');
    button.click();
    await expect(button).toHaveText('count: 1');

    await rsbuild.close();
  },
);
