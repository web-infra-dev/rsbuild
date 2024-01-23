import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';

test('decorator legacy(default)', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {},
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.aaa')).toBe('hello!');
  expect(await page.evaluate('window.bbb')).toBe('world');

  await rsbuild.close();
});

test('decorator latest', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      output: {
        enableLatestDecorators: true,
      },
    },
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.aaa')).toBe('hello!');
  expect(await page.evaluate('window.bbb')).toBe('world');

  await rsbuild.close();
});
