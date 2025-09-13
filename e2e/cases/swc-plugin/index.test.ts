import { expect, gotoPage, rspackTest } from '@e2e/helper';

rspackTest(
  'should run SWC Wasm plugin correctly in dev',
  async ({ page, devOnly }) => {
    const rsbuild = await devOnly();

    const msgPromise = page.waitForEvent('console');
    await gotoPage(page, rsbuild);

    const msg = await msgPromise;
    expect(await msg.args()[0].jsonValue()).toEqual('this is error');
  },
);

rspackTest(
  'should run SWC Wasm plugin correctly in production build',
  async ({ page, build }) => {
    const rsbuild = await build({
      runServer: true,
    });

    const msgPromise = page.waitForEvent('console');
    await gotoPage(page, rsbuild);

    const msg = await msgPromise;
    expect(await msg.args()[0].jsonValue()).toEqual('this is error');
  },
);
