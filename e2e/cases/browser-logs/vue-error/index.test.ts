import { gotoPage, rspackTest } from '@e2e/helper';

rspackTest(
  'should forward Vue runtime error logs to terminal',
  async ({ devOnly, page }) => {
    const rsbuild = await devOnly();

    await gotoPage(page, rsbuild, '/undefinedError');
    await rsbuild.expectLog(
      `error   [browser] Uncaught TypeError: Cannot read properties of undefined (reading 'name') at Proxy.render (src/UndefinedError.vue:2:0)`,
      { posix: true },
    );

    await gotoPage(page, rsbuild, '/eventError');
    await page.click('button');
    await rsbuild.expectLog(
      `error   [browser] Uncaught TypeError: Cannot read properties of null (reading 'someMethod') at handleClick (src/EventError.vue:8:0)`,
      { posix: true },
    );
  },
);
