import { expect, test } from '@playwright/test';
import { gotoPage } from '@scripts/shared';
import { startDevServer } from './scripts/server.mjs';
import { startDevServerPure } from './scripts/pure-server.mjs';

test('custom server', async ({ page }) => {
  const { config, close } = await startDevServer(__dirname);

  await gotoPage(page, config);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  const url1 = new URL(`http://localhost:${config.port}/bbb`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toBe('Hello Express!');

  await close();
});

test('custom server without compile', async ({ page }) => {
  const { config, close } = await startDevServerPure(__dirname);
  const indexRes = await gotoPage(page, config);

  expect(indexRes?.status()).toBe(404);

  const url1 = new URL(`http://localhost:${config.port}/bbb`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toBe('Hello Express!');

  const url2 = new URL(`http://localhost:${config.port}/test`);

  const res2 = await page.goto(url2.href);

  expect(await res2?.text()).toBe('Hello Express!');

  await close();
});
