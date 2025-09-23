import { expect, gotoPage, rspackTest } from '@e2e/helper';

const BUILD_FOO = 'building src/foo.js';

rspackTest(
  'should lazy compile dynamic imported modules',
  async ({ page, devOnly }) => {
    const rsbuild = await devOnly();

    // initial build
    await rsbuild.expectBuildEnd();
    rsbuild.expectNoLog(BUILD_FOO);
    rsbuild.clearLogs();

    // build foo.js
    await gotoPage(page, rsbuild, 'index');
    await rsbuild.expectLog(BUILD_FOO);
    await rsbuild.expectBuildEnd();
    const value = await page.evaluate(() => window.foo);
    expect(value).toBe(42);
  },
);
