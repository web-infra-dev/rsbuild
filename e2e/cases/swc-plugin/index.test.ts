import { expect, gotoPage, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should run SWC Wasm plugin correctly in dev',
  async ({ page, devOnly }) => {
    const rsbuild = await devOnly();

    const msgPromise = page.waitForEvent('console');
    await gotoPage(page, rsbuild);

    const msg = await msgPromise;
    expect(await msg.args()[0].jsonValue()).toEqual('this is error');
  },
);

rspackOnlyTest(
  'should run SWC Wasm plugin correctly in production build',
  async ({ page, buildOnly }) => {
    const rsbuild = await buildOnly({
      runServer: true,
    });

    const msgPromise = page.waitForEvent('console');
    await gotoPage(page, rsbuild);

    const msg = await msgPromise;
    expect(await msg.args()[0].jsonValue()).toEqual('this is error');
  },
);
