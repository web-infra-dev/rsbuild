import fs from 'node:fs';
import path from 'node:path';
import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('support SSR load esm with type module', async ({ page }) => {
  const distPath = path.join(__dirname, './dist');
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath);
  }
  fs.writeFileSync(
    path.join(distPath, './package.json'),
    JSON.stringify({ type: 'module' }),
  );
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {},
  });

  const url1 = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await rsbuild.close();
});
