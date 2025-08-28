import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest(
  'should lazy compile dynamic imported modules',
  async ({ page }) => {
    if (process.platform === 'win32') {
      test.skip();
    }

    const rsbuild = await dev({
      cwd: __dirname,
    });

    // the first build
    await rsbuild.expectBuildEnd();
    rsbuild.clearLogs();

    // build foo.js
    await gotoPage(page, rsbuild, 'index');
    await rsbuild.expectBuildEnd();
    const value = await page.evaluate(() => window.foo);
    expect(value).toBe(42);
    await rsbuild.close();
  },
);
