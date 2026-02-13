import { expect, gotoPage, test } from '@e2e/helper';

test('should run SWC Wasm plugin correctly', async ({ page, runBoth }) => {
  await runBoth(
    async ({ result }) => {
      const msgPromise = page.waitForEvent('console');
      await gotoPage(page, result);

      const msg = await msgPromise;
      expect(await msg.args()[0].jsonValue()).toEqual('this is error');
    },
    { runServer: true },
  );
});
