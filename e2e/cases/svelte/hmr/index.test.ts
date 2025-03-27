import fs from 'node:fs';
import path from 'node:path';
import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginSvelte } from '@rsbuild/plugin-svelte';

rspackOnlyTest('HMR should work properly', async ({ page }) => {
  // HMR cases will fail on Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  const root = __dirname;
  const bPath = path.join(root, 'src/test-temp-B.svelte');
  fs.writeFileSync(
    bPath,
    fs.readFileSync(path.join(root, 'src/B.svelte'), 'utf-8'),
  );

  const rsbuild = await dev({
    cwd: root,
    page,
    plugins: [pluginSvelte()],
  });

  const a = page.locator('#A');
  const b = page.locator('#B');

  await expect(a).toHaveText('A: 0');
  await expect(b).toHaveText('B: 0');

  await a.click({ clickCount: 5 });
  await expect(a).toHaveText('A: 5');
  await expect(b).toHaveText('B: 5');

  // simulate a change to component B's source code
  const sourceCodeB = fs.readFileSync(bPath, 'utf-8');
  fs.writeFileSync(bPath, sourceCodeB.replace('B:', 'Beep:'), 'utf-8');

  // content of B changed to `Beep: 0` means HMR has taken effect
  await expect(b).toHaveText('Beep: 0');
  // the state (count) of A is not kept because `svelte-loader` does not support HMR for Svelte 5 yet
  await expect(a).toHaveText('A: 0');

  fs.writeFileSync(bPath, sourceCodeB, 'utf-8'); // recover the source code
  await rsbuild.close();
});
