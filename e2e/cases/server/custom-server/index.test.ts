import { gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { startDevServerPure } from './scripts/pureServer.mjs';
import { startDevServer } from './scripts/server.mjs';

rspackOnlyTest('custom server', async ({ page }) => {
  const { config, close } = await startDevServer(import.meta.dirname);

  await gotoPage(page, config);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  const url1 = new URL(`http://localhost:${config.port}/bbb`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toBe('Hello polka!');

  await close();
});

rspackOnlyTest('custom server without compile', async ({ page }) => {
  const { config, close } = await startDevServerPure(import.meta.dirname);
  const indexRes = await gotoPage(page, config);

  expect(indexRes?.status()).toBe(404);

  const url1 = new URL(`http://localhost:${config.port}/bbb`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toBe('Hello polka!');

  const url2 = new URL(`http://localhost:${config.port}/test`);

  const res2 = await page.goto(url2.href);

  expect(await res2?.text()).toBe('Hello polka!');

  await close();
});
