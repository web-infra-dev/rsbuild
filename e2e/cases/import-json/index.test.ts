import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should import JSON correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.b')).toBe('{"list":[1,2]}');

  await rsbuild.close();
});

test.skip('should named import JSON correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          index: './src/index-named-export',
        },
      },
    },
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.age')).toBe(1);

  await rsbuild.close();
});
