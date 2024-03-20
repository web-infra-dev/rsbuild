import { expect } from '@playwright/test';
import { build, dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import path from 'node:path';
import fs from 'node:fs';

rspackOnlyTest('should render', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  await expect(page.locator('.named')).toHaveText('named 0');
  await expect(page.locator('.named-specifier')).toHaveText(
    'named specifier 1',
  );
  await expect(page.locator('.default')).toHaveText('default 2');
  await expect(page.locator('.default-tsx')).toHaveText('default tsx 3');
  await expect(page.locator('.script')).toHaveText('script 4');
  await expect(page.locator('.ts-import')).toHaveText('success');
  await rsbuild.close();
});

rspackOnlyTest('should update', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  await page.locator('.named').click();
  await expect(page.locator('.named')).toHaveText('named 1');
  await page.locator('.named-specifier').click();
  await expect(page.locator('.named-specifier')).toHaveText(
    'named specifier 2',
  );
  await page.locator('.default').click();
  await expect(page.locator('.default')).toHaveText('default 3');
  await page.locator('.default-tsx').click();
  await expect(page.locator('.default-tsx')).toHaveText('default tsx 4');
  await page.locator('.script').click();
  await expect(page.locator('.script')).toHaveText('script 5');
});

rspackOnlyTest('hmr: named export', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
  });

  await gotoPage(page, rsbuild);

  await page.locator('.named').click();
  await expect(page.locator('.named')).toHaveText('named 1');
  await page.locator('.named-specifier').click();
  await expect(page.locator('.named-specifier')).toHaveText(
    'named specifier 2',
  );
  await page.locator('.default').click();
  await expect(page.locator('.default')).toHaveText('default 3');
  await page.locator('.default-tsx').click();
  await expect(page.locator('.default-tsx')).toHaveText('default tsx 4');

  editFile('Comps.jsx', (code) =>
    code.replace('named {count', 'named updated {count'),
  );

  await untilUpdated(
    () => page.locator('.named').textContent(),
    'named updated 0',
  );

  // affect all components in same file
  await expect(page.locator('.named-specifier')).toHaveText(
    'named specifier 1',
  );
  await expect(page.locator('.default')).toHaveText('default 2');
  // should not affect other components from different file
  expect(await page.textContent('.default-tsx')).toMatch('default tsx 4');

  await rsbuild.close();
});

function editFile(filename: string, replacer: (str: string) => string): void {
  filename = path.join(__dirname, 'src', filename);
  const content = fs.readFileSync(filename, 'utf-8');
  const modified = replacer(content);
  fs.writeFileSync(filename, modified);
}

const timeout = (n: number) => new Promise((r) => setTimeout(r, n));

export async function untilUpdated(
  poll: () => Promise<string | null>,
  expected: string,
): Promise<void> {
  const maxTries = 50;
  for (let tries = 0; tries < maxTries; tries++) {
    const actual = (await poll()) ?? '';
    if (actual.indexOf(expected) > -1 || tries === maxTries - 1) {
      expect(actual).toMatch(expected);
      break;
    } else {
      await timeout(50);
    }
  }
}
