import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should apply plugin as expected when running dev server',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    const body = page.locator('body');
    await expect(body).toHaveText('serve-plugin');
    await expect(body).not.toHaveText('build-plugin');

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should apply plugin as expected when running build',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const body = page.locator('body');
    await expect(body).toHaveText('build-plugin');
    await expect(body).not.toHaveText('serve-plugin');

    await rsbuild.close();
  },
);
