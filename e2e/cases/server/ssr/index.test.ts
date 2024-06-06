import { rspackOnlyTest, updateConfigForTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { startDevServer } from './scripts/server.mjs';

rspackOnlyTest('support SSR', async ({ page }) => {
  const { config, close } = await startDevServer(
    __dirname,
    await updateConfigForTest({}, __dirname),
  );

  const url1 = new URL(`http://localhost:${config.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await close();
});

rspackOnlyTest('support SSR with esm target', async ({ page }) => {
  process.env.TEST_ESM_LIBRARY = '1';
  const { config, close } = await startDevServer(
    __dirname,
    await updateConfigForTest({}, __dirname),
  );

  const url1 = new URL(`http://localhost:${config.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await close();

  delete process.env.TEST_ESM_LIBRARY;
});

rspackOnlyTest('support SSR with split chunk', async ({ page }) => {
  process.env.TEST_SPLIT_CHUNK = '1';
  const { config, close } = await startDevServer(
    __dirname,
    await updateConfigForTest({}, __dirname),
  );

  const url1 = new URL(`http://localhost:${config.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await close();

  delete process.env.TEST_SPLIT_CHUNK;
});
