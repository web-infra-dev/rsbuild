import { expect, gotoPage, rspackTest } from '@e2e/helper';

rspackTest(
  'should run SWC Wasm plugin correctly in dev',
  async ({ page, devOnly }) => {
    // SWC plugin cannot strip console[method] calls from Rsbuild's internal runtime logger.
    const rsbuild = await devOnly({
      config: { dev: { client: { logLevel: 'silent' } } },
    });

    const msgPromise = page.waitForEvent('console');
    await gotoPage(page, rsbuild);

    const msg = await msgPromise;
    expect(await msg.args()[0].jsonValue()).toEqual('this is error');
  },
);

rspackTest(
  'should run SWC Wasm plugin correctly in build',
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
