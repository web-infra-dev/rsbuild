import fs from 'fs';
import path from 'path';
import { expect } from '@playwright/test';
import { rspackOnlyTest } from '@scripts/helper';
import { dev, getHrefByEntryName } from '@scripts/shared';

rspackOnlyTest('hmr should work properly', async ({ page }) => {
  const root = path.join(__dirname, 'hmr');

  const handle = await dev({
    cwd: root,
  });

  await page.goto(getHrefByEntryName('index', handle.port));

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

  // content of B changed to `Beap: 5` means HMR has taken effect
  await expect(b).toHaveText('Beep: 5');
  // the state (count) of A should be kept
  await expect(a).toHaveText('A: 5');

  fs.writeFileSync(filePath, sourceCodeB, 'utf-8'); // recover the source code
  handle.server.close();
});
