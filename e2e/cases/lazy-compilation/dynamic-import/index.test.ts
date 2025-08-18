import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { test } from '@playwright/test';

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
    rsbuild.expectNoLog('building src/foo.js');
    rsbuild.clearLogs();

    // build foo.js
    await gotoPage(page, rsbuild, 'index');
    await rsbuild.expectLog('building src/foo.js');
    await rsbuild.expectBuildEnd();
    await rsbuild.close();
  },
);
