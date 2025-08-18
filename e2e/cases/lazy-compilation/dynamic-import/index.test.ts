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

    await rsbuild.expectBuildEnd();
    expect(
      rsbuild.logs.some((log) => log.includes('building src/foo.js')),
    ).toBeFalsy();

    await gotoPage(page, rsbuild, 'index');
    await rsbuild.expectLog('building src/foo.js');
    await rsbuild.close();
  },
);
