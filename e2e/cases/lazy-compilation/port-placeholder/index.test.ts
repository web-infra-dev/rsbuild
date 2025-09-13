import { expect, gotoPage, rspackTest } from '@e2e/helper';

rspackTest(
  'should replace port placeholder with actual port',
  async ({ page, devOnly }) => {
    const rsbuild = await devOnly();

    // the first build
    await rsbuild.expectBuildEnd();
    rsbuild.clearLogs();

    // build page1
    await gotoPage(page, rsbuild, 'page1');
    await rsbuild.expectBuildEnd();
    await expect(page.locator('#test')).toHaveText('Page 1');
    rsbuild.clearLogs();

    // build page2
    await gotoPage(page, rsbuild, 'page2');
    await rsbuild.expectBuildEnd();
    await expect(page.locator('#test')).toHaveText('Page 2');
  },
);
