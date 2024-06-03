import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { startDevServer } from './scripts/server.mjs';

rspackOnlyTest('server ssr', async ({ page }) => {
  const { config, close } = await startDevServer(__dirname);

  const url1 = new URL(`http://localhost:${config.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await close();
});

rspackOnlyTest('server ssr with esm target', async ({ page }) => {
  process.env.TEST_ESM_LIBRARY = '1';
  const { config, close } = await startDevServer(__dirname);

  const url1 = new URL(`http://localhost:${config.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await close();

  delete process.env.TEST_ESM_LIBRARY;
});
