import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should glob import components in dev build correctly',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    await expect(page.locator('#header')).toHaveText('Header');
    await expect(page.locator('#footer')).toHaveText('Footer');

    rsbuild.close();
  },
);

rspackOnlyTest(
  'should glob import components in prod build correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    await expect(page.locator('#header')).toHaveText('Header');
    await expect(page.locator('#footer')).toHaveText('Footer');

    rsbuild.close();
  },
);
