import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';
import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('hmr should work properly', async ({ page }) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  const root = __dirname;

  const rsbuild = await dev({
    cwd: root,
  });

  await gotoPage(page, rsbuild);

  const a = page.locator('#A');
  const b = page.locator('#B');

  await expect(a).toHaveText('A: 0');
  await expect(b).toHaveText('B: 0');

  await a.click({ clickCount: 5 });
  await expect(a).toHaveText('A: 5');
  await expect(b).toHaveText('B: 5');

  // simulate a change to component B's source code
  const filePath = path.join(root, 'src/B.jsx');
  const sourceCodeB = fs.readFileSync(filePath, 'utf-8');
  fs.writeFileSync(filePath, sourceCodeB.replace('B:', 'Beep:'), 'utf-8');

  await page.waitForFunction(() => {
    const aText = document.querySelector('#A')!.textContent;
    const bText = document.querySelector('#B')!.textContent;

    return (
      // the state (count) of A should be kept
      aText === 'A: 5' &&
      // content of B changed to `Beep: 5` means HMR has taken effect
      bText === 'Beep: 5'
    );
  });

  // recover the source code
  fs.writeFileSync(filePath, sourceCodeB, 'utf-8');
  rsbuild.server.close();
});
