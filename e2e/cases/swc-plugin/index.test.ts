import { build, dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should run SWC Wasm plugin correctly in dev mode',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: import.meta.dirname,
    });

    const msgPromise = page.waitForEvent('console');
    await gotoPage(page, rsbuild);

    const msg = await msgPromise;
    expect(await msg.args()[0].jsonValue()).toEqual('this is error');

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should run SWC Wasm plugin correctly in production build',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: import.meta.dirname,
      runServer: true,
    });

    const msgPromise = page.waitForEvent('console');
    await gotoPage(page, rsbuild);

    const msg = await msgPromise;
    expect(await msg.args()[0].jsonValue()).toEqual('this is error');

    await rsbuild.close();
  },
);
