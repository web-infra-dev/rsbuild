import { expect, test, type Page } from '@playwright/test';
import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import path from 'node:path';
import fs from 'node:fs';

rspackOnlyTest('should render', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
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

  await page.locator('.script').click();
  await expect(page.locator('.script')).toHaveText('script 5');

  await rsbuild.close();
});

rspackOnlyTest.describe('vue jsx hmr', () => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  let rsbuild: Awaited<ReturnType<typeof dev>>;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    rsbuild = await dev({
      cwd: __dirname,
    });
    page = await browser.newPage();
    await gotoPage(page, rsbuild);
  });

  test.afterAll(async () => {
    // reset files
    editFile('Comps.jsx', (code) =>
      code.replace('named updated {count', 'named {count'),
    );
    editFile('Comps.jsx', (code) =>
      code.replace('named specifier updated {count', 'named specifier {count'),
    );
    editFile('Comps.jsx', (code) =>
      code.replace('default updated {count', 'default {count'),
    );
    editFile('Comp.tsx', (code) =>
      code.replace('default tsx updated {count', 'default tsx {count'),
    );
    editFile('setup-syntax-jsx.vue', (code) =>
      code.replace('let count = ref(1000)', 'let count = ref(100)'),
    );

    await rsbuild.close();
  });

  test('hmr: named export', async () => {
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
    await untilUpdated(() => page.textContent('.named'), 'named updated 0');

    // affect all components in same file
    await expect(page.locator('.named-specifier')).toHaveText(
      'named specifier 1',
    );
    await expect(page.locator('.default')).toHaveText('default 2');
    // should not affect other components from different file
    await expect(page.locator('.default-tsx')).toHaveText('default tsx 4');
  });

  test('hmr: named export via specifier', async () => {
    editFile('Comps.jsx', (code) =>
      code.replace('named specifier {count', 'named specifier updated {count'),
    );
    await untilUpdated(
      () => page.textContent('.named-specifier'),
      'named specifier updated 1',
    );

    // affect all components in same file
    await expect(page.locator('.default')).toHaveText('default 2');
    // should not affect other components on the page
    await expect(page.locator('.default-tsx')).toHaveText('default tsx 4');
  });

  test('hmr: default export', async () => {
    editFile('Comps.jsx', (code) =>
      code.replace('default {count', 'default updated {count'),
    );
    await untilUpdated(() => page.textContent('.default'), 'default updated 2');

    // should not affect other components on the page
    await expect(page.locator('.default-tsx')).toHaveText('default tsx 4');
  });

  test('hmr: default Default export', async () => {
    await page.locator('.named').click();
    await expect(page.locator('.named')).toHaveText('named updated 1');

    editFile('Comp.tsx', (code) =>
      code.replace('default tsx {count', 'default tsx updated {count'),
    );
    await untilUpdated(
      () => page.textContent('.default-tsx'),
      'default tsx updated 3',
    );

    // should not affect other components on the page
    await expect(page.locator('.named')).toHaveText('named updated 1');
  });

  // not pass
  test.skip('hmr: vue script lang=jsx', async () => {
    await page.locator('.script').click();
    await expect(page.locator('.script')).toHaveText('script 5');

    editFile('Script.vue', (code) =>
      code.replace('script {count', 'script updated {count'),
    );

    await untilUpdated(() => page.textContent('.script'), 'script updated 4');

    // reset code
    editFile('Script.vue', (code) =>
      code.replace('script updated {count', 'script {count'),
    );
  });

  // not pass
  test.skip('hmr: script in .vue', async () => {
    await page.locator('.src-import').click();
    await expect(page.locator('.src-import')).toHaveText('src import 6');

    editFile('Script.vue', (code) =>
      code.replace('script {count', 'script updated {count'),
    );
    await untilUpdated(() => page.textContent('.script'), 'script updated 4');

    await expect(page.locator('.src-import')).toHaveText('src import 6');

    // reset code
    editFile('Script.vue', (code) =>
      code.replace('script updated {count', 'script {count'),
    );
  });

  // not pass
  test.skip('hmr: src import in .vue', async () => {
    await page.locator('.script').click();
    await expect(page.locator('.script')).toHaveText('script 5');

    editFile('SrcImport.jsx', (code) =>
      code.replace('src import {count', 'src import updated {count'),
    );

    await untilUpdated(
      () => page.textContent('.src-import'),
      'src import updated 5',
    );

    await expect(page.locator('.script')).toHaveText('script 5');

    // reset code
    editFile('SrcImport.jsx', (code) =>
      code.replace('src import updated {count', 'src import {count'),
    );
  });

  test('hmr: setup jsx in .vue', async () => {
    editFile('setup-syntax-jsx.vue', (code) =>
      code.replace('let count = ref(100)', 'let count = ref(1000)'),
    );

    await untilUpdated(() => page.textContent('.setup-jsx'), '1000');
  });
});

function editFile(filename: string, replacer: (str: string) => string): void {
  const fileName = path.join(__dirname, 'src', filename);
  const content = fs.readFileSync(fileName, 'utf-8');
  const modified = replacer(content);
  fs.writeFileSync(fileName, modified);
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
    }

    await timeout(50);
  }
}
