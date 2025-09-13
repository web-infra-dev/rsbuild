import fs from 'node:fs';
import path from 'node:path';
import { expect, rspackTest } from '@e2e/helper';
import { pluginSvelte } from '@rsbuild/plugin-svelte';

rspackTest('HMR should work properly', async ({ page, dev }) => {
  const cwd = __dirname;
  const bPath = path.join(cwd, 'src/test-temp-B.svelte');
  fs.writeFileSync(
    bPath,
    fs.readFileSync(path.join(cwd, 'src/B.svelte'), 'utf-8'),
  );

  await dev({
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
});
