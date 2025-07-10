import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('support SSR load esm with type module', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
  });

  const url1 = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await rsbuild.close();
});
