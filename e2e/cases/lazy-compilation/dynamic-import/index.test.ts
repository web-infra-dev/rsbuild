import { expect, gotoPage, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should lazy compile dynamic imported modules',
  async ({ page, devOnly }) => {
    const rsbuild = await devOnly();

    // the first build
    await rsbuild.expectBuildEnd();
    rsbuild.clearLogs();

    // build foo.js
    await gotoPage(page, rsbuild, 'index');
    await rsbuild.expectBuildEnd();
    const value = await page.evaluate(() => window.foo);
    expect(value).toBe(42);
  },
);
