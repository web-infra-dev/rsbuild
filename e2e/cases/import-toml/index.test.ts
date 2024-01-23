import { expect } from '@playwright/test';
import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('should import TOML correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.age')).toBe(1);
  expect(await page.evaluate('window.b')).toBe('{"list":[1,2]}');

  await rsbuild.close();
});
