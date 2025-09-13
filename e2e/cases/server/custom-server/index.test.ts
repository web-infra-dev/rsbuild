import { expect, gotoPage, rspackTest } from '@e2e/helper';
// @ts-expect-error
import { startDevServerPure } from './scripts/pureServer.mjs';
// @ts-expect-error
import { startDevServer } from './scripts/server.mjs';

rspackTest('should support a custom dev server', async ({ page }) => {
  const { config, close } = await startDevServer(__dirname);

  await gotoPage(page, config);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  const url1 = new URL(`http://localhost:${config.port}/bbb`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toBe('Hello polka!');

  await close();
});

rspackTest(
  'should support a custom dev server without compilation',
  async ({ page }) => {
    const { config, close } = await startDevServerPure(__dirname);
    const indexRes = await gotoPage(page, config);

    expect(indexRes?.status()).toBe(404);

    const url1 = new URL(`http://localhost:${config.port}/bbb`);

    const res = await page.goto(url1.href);

    expect(await res?.text()).toBe('Hello polka!');

    const url2 = new URL(`http://localhost:${config.port}/test`);

    const res2 = await page.goto(url2.href);

    expect(await res2?.text()).toBe('Hello polka!');

    await close();
  },
);
