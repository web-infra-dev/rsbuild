import path from 'path';
import fs from 'fs';
import { expect } from '@playwright/test';
import { build, dev, getHrefByEntryName } from '@scripts/shared';
import { pluginSvelte } from '@rsbuild/plugin-svelte';
import { rspackOnlyTest } from '@scripts/helper';

rspackOnlyTest(
  'should build basic svelte component properly',
  async ({ page }) => {
    const root = path.join(__dirname, 'basic');

    const handle = await build({
      cwd: root,
      entry: {
        main: path.join(root, 'src/index.js'),
      },
      runServer: true,
      plugins: [pluginSvelte()],
    });

    await page.goto(getHrefByEntryName('main', handle.port));

    const title = page.locator('#title');

    await expect(title).toHaveText('Hello world!');

    handle.close();
  },
);

rspackOnlyTest('hmr should work properly', async ({ page }) => {
  const root = path.join(__dirname, 'hmr');

  const handle = await dev({
    cwd: root,
    entry: {
      main: path.join(root, 'src/index.js'),
    },
    plugins: [pluginSvelte()],
  });

  await page.goto(getHrefByEntryName('main', handle.port));

  const a = page.locator('#A');
  const b = page.locator('#B');

  await expect(a).toHaveText('A: 0');
  await expect(b).toHaveText('B: 0');

  await a.click({ clickCount: 5 });
  await expect(a).toHaveText('A: 5');
  await expect(b).toHaveText('B: 5');

  // simulate a change to component B's source code
  const bPath = path.join(root, 'src/B.svelte');
  const sourceCodeB = fs.readFileSync(bPath, 'utf-8');
  fs.writeFileSync(bPath, sourceCodeB.replace('B:', 'Beep:'), 'utf-8');

  // content of B changed to `Beap: 5` means HMR has taken effect
  await expect(b).toHaveText('Beep: 5');
  // the state (count) of A should be kept
  await expect(a).toHaveText('A: 5');

  fs.writeFileSync(bPath, sourceCodeB, 'utf-8'); // recover the source code
  handle.server.close();
});
