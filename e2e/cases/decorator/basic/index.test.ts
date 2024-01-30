import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';

test('should use legacy decorators by default', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.aaa')).toBe('hello!');
  expect(await page.evaluate('window.bbb')).toBe('world');

  await rsbuild.close();
});

test('should allow to use stage 3 decorators', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      source: {
        decorators: {
          version: '2022-03',
        },
      },
    },
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.aaa')).toBe('hello!');
  expect(await page.evaluate('window.bbb')).toBe('world');

  await rsbuild.close();
});
