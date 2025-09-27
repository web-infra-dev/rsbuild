import { gotoPage, rspackTest } from '@e2e/helper';

rspackTest(
  'should not output the same error log consecutively',
  async ({ devOnly, page }) => {
    const rsbuild = await devOnly();
    await gotoPage(page, rsbuild, '/', { hash: 'test1' });
    await rsbuild.expectLog('Uncaught Error: #test1');
    rsbuild.clearLogs();

    await page.reload();
    await gotoPage(page, rsbuild, '/', { hash: 'test2' });
    await page.reload();
    await rsbuild.expectLog('Uncaught Error: #test2');
    rsbuild.expectNoLog('Uncaught Error: #test1');
  },
);
