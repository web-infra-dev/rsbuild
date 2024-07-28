import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('support SSR', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {},
  });

  const url1 = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await rsbuild.close();
});

rspackOnlyTest('support SSR with esm target', async ({ page }) => {
  process.env.TEST_ESM_LIBRARY = '1';

  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {},
  });

  const url1 = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await rsbuild.close();

  delete process.env.TEST_ESM_LIBRARY;
});

rspackOnlyTest('support SSR with split chunk', async ({ page }) => {
  process.env.TEST_SPLIT_CHUNK = '1';

  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {},
  });

  const url1 = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await rsbuild.close();

  delete process.env.TEST_SPLIT_CHUNK;
});
