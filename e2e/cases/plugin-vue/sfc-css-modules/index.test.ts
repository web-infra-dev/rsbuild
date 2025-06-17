import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should build Vue SFC with CSS Modules correctly in dev build',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    const test1 = page.locator('#test1');
    const test2 = page.locator('#test2');
    const test3 = page.locator('#test3');

    await expect(test1).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(test2).toHaveCSS('color', 'rgb(0, 0, 255)');
    await expect(test3).toHaveCSS('color', 'rgb(0, 128, 0)');

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should build Vue SFC with CSS Modules correctly in prod build',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const test1 = page.locator('#test1');
    const test2 = page.locator('#test2');
    const test3 = page.locator('#test3');

    await expect(test1).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(test2).toHaveCSS('color', 'rgb(0, 0, 255)');
    await expect(test3).toHaveCSS('color', 'rgb(0, 128, 0)');

    await rsbuild.close();
  },
);
