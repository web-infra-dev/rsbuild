import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest(
  'should replace port placeholder with actual port',
  async ({ page }) => {
    if (process.platform === 'win32') {
      test.skip();
    }

    const rsbuild = await dev({
      cwd: __dirname,
    });

    await gotoPage(page, rsbuild, 'page1');
    await expect(page.locator('#test')).toHaveText('Page 1');
    await rsbuild.expectLog('building src/page1/index.js');
    expect(
      rsbuild.logs.some((log) => log.includes('building src/page2/index.js')),
    ).toBeFalsy();

    await gotoPage(page, rsbuild, 'page2');
    await expect(page.locator('#test')).toHaveText('Page 2');
    await rsbuild.expectLog('building src/page2/index.js');
    await rsbuild.close();
  },
);
